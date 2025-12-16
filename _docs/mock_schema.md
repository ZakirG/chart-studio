-- Below is a mock format for the MySQL database, which we have yet
-- to receive from Leap.

-- Organizations / offices / teams / users
CREATE TABLE offices (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  tz VARCHAR(64) NOT NULL,
  latitude DECIMAL(9,6), longitude DECIMAL(9,6)
);

CREATE TABLE teams (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  office_id BIGINT NOT NULL,
  name VARCHAR(120) NOT NULL,
  FOREIGN KEY (office_id) REFERENCES offices(id)
);

CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  office_id BIGINT NOT NULL,
  team_id BIGINT NULL,
  role ENUM('admin','manager','rep','tech') NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(190) UNIQUE,
  active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (office_id) REFERENCES offices(id),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE customers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  office_id BIGINT NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(190), phone VARCHAR(40),
  address1 VARCHAR(160), city VARCHAR(100), state VARCHAR(64), postal_code VARCHAR(32),
  latitude DECIMAL(9,6), longitude DECIMAL(9,6),
  created_at DATETIME NOT NULL,
  FOREIGN KEY (office_id) REFERENCES offices(id)
);

CREATE TABLE referral_sources (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  channel ENUM('web','ad','partner','event','word_of_mouth','other') NOT NULL
);


-- Sales Performance (by rep, month)
CREATE VIEW v_sales_performance AS
SELECT
  j.office_id,
  j.sales_rep_user_id AS rep_user_id,
  DATE_FORMAT(COALESCE(j.closed_at, j.created_at), '%Y-%m-01') AS period_month,
  SUM(CASE WHEN j.status='closed_won' THEN j.total_contract_amount ELSE 0 END) AS won_amount,
  COUNT(*) AS jobs_count
FROM jobs j
GROUP BY 1,2,3;

-- Company Performance (office rollups by month)
CREATE VIEW v_company_performance AS
SELECT
  j.office_id,
  DATE_FORMAT(COALESCE(j.closed_at, j.created_at), '%Y-%m-01') AS period_month,
  SUM(CASE WHEN j.status='closed_won' THEN j.total_contract_amount ELSE 0 END) AS revenue_won,
  SUM(CASE WHEN j.status IN ('closed_lost','cancelled') THEN 1 ELSE 0 END) AS lost_jobs,
  SUM(CASE WHEN j.status='closed_won' THEN 1 ELSE 0 END) AS won_jobs
FROM jobs j
GROUP BY 1,2;

-- Referral Source Analysis
CREATE VIEW v_referral_source AS
SELECT
  l.office_id,
  rs.name AS referral_source,
  DATE_FORMAT(l.created_at, '%Y-%m-01') AS period_month,
  COUNT(*) AS leads,
  SUM(CASE WHEN l.status='converted' THEN 1 ELSE 0 END) AS converted_leads
FROM leads l
LEFT JOIN referral_sources rs ON rs.id = l.referral_source_id
GROUP BY 1,2,3;

-- Accounts Receivable (invoice balance + aging)
CREATE VIEW v_ar AS
SELECT
  i.id AS invoice_id,
  j.office_id,
  i.issue_date, i.due_date,
  i.total_amount,
  IFNULL((
    SELECT SUM(pa.amount_applied) FROM payment_applications pa WHERE pa.invoice_id = i.id
  ),0) AS total_paid,
  (i.total_amount - IFNULL((
    SELECT SUM(pa.amount_applied) FROM payment_applications pa WHERE pa.invoice_id = i.id
  ),0)) AS balance,
  CASE
    WHEN DATEDIFF(CURDATE(), i.due_date) <= 30 THEN '0-30'
    WHEN DATEDIFF(CURDATE(), i.due_date) <= 60 THEN '31-60'
    WHEN DATEDIFF(CURDATE(), i.due_date) <= 90 THEN '61-90'
    ELSE '90+'
  END AS aging_bucket
FROM invoices i
JOIN jobs j ON j.id = i.job_id
WHERE i.status IN ('sent','overdue','partial');

-- Sales Tax (by jurisdiction, month)
CREATE VIEW v_sales_tax AS
SELECT
  tj.id AS tax_jurisdiction_id,
  tj.name,
  DATE_FORMAT(i.issue_date, '%Y-%m-01') AS period_month,
  SUM(ili.quantity * ili.unit_price * tj.rate) AS tax_collected
FROM invoice_line_items ili
JOIN invoices i ON i.id = ili.invoice_id
LEFT JOIN tax_jurisdictions tj ON tj.id = ili.tax_jurisdiction_id
GROUP BY 1,2,3;

-- Commission summary
CREATE VIEW v_commissions AS
SELECT
  rep_user_id,
  period_month,
  SUM(basis_amount) AS basis_total,
  AVG(rate) AS avg_rate,
  SUM(amount) AS commission_total
FROM commissions
GROUP BY 1,2;

-- Master List (jobs + customers)
CREATE VIEW v_master_jobs AS
SELECT
  j.id AS job_id, j.job_number, j.status, j.job_type,
  j.created_at, j.scheduled_start, j.scheduled_end, j.closed_at,
  j.total_contract_amount,
  c.full_name AS customer_name, c.city, c.state,
  j.office_id
FROM jobs j
JOIN customers c ON c.id = j.customer_id;

-- Appointments conversion
CREATE VIEW v_appointments AS
SELECT
  a.office_id,
  DATE(a.scheduled_at) AS sched_date,
  COUNT(*) AS appt_count,
  SUM(CASE WHEN a.outcome='completed' THEN 1 ELSE 0 END) AS completed,
  SUM(CASE WHEN a.converted_to_job=1 THEN 1 ELSE 0 END) AS converted
FROM appointments a
GROUP BY 1,2;
