#!/usr/bin/env python3
"""
Mock Data Generator for Leap Project
Generates realistic mock data for all tables in the schema and inserts into MySQL database.
"""

import mysql.connector
from mysql.connector import Error
import random
from datetime import datetime, timedelta
import uuid
from faker import Faker
import argparse
import sys

# Initialize Faker for generating realistic data
fake = Faker('en_US')
Faker.seed(42)  # For reproducible results
random.seed(42)

class MockDataGenerator:
    def __init__(self, host='localhost', database='leap_mock', user='root', password=''):
        self.host = host
        self.database = database
        self.user = user
        self.password = password
        self.connection = None
        self.cursor = None
        
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                database=self.database,
                user=self.user,
                password=self.password
            )
            self.cursor = self.connection.cursor()
            print(f"Connected to MySQL database: {self.database}")
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            sys.exit(1)
    
    def disconnect(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.cursor.close()
            self.connection.close()
            print("MySQL connection closed")
    
    def execute_schema(self):
        """Create tables based on the schema"""
        schema_commands = [
            """
            CREATE TABLE IF NOT EXISTS offices (
              id BIGINT PRIMARY KEY AUTO_INCREMENT,
              name VARCHAR(120) NOT NULL,
              tz VARCHAR(64) NOT NULL,
              latitude DECIMAL(9,6), 
              longitude DECIMAL(9,6)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS teams (
              id BIGINT PRIMARY KEY AUTO_INCREMENT,
              office_id BIGINT NOT NULL,
              name VARCHAR(120) NOT NULL,
              FOREIGN KEY (office_id) REFERENCES offices(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS users (
              id BIGINT PRIMARY KEY AUTO_INCREMENT,
              office_id BIGINT NOT NULL,
              team_id BIGINT NULL,
              role ENUM('admin','manager','rep','tech') NOT NULL,
              full_name VARCHAR(160) NOT NULL,
              email VARCHAR(190) UNIQUE,
              active TINYINT(1) DEFAULT 1,
              FOREIGN KEY (office_id) REFERENCES offices(id),
              FOREIGN KEY (team_id) REFERENCES teams(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS customers (
              id BIGINT PRIMARY KEY AUTO_INCREMENT,
              office_id BIGINT NOT NULL,
              full_name VARCHAR(160) NOT NULL,
              email VARCHAR(190), 
              phone VARCHAR(40),
              address1 VARCHAR(160), 
              city VARCHAR(100), 
              state VARCHAR(64), 
              postal_code VARCHAR(32),
              latitude DECIMAL(9,6), 
              longitude DECIMAL(9,6),
              created_at DATETIME NOT NULL,
              FOREIGN KEY (office_id) REFERENCES offices(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS referral_sources (
              id BIGINT PRIMARY KEY AUTO_INCREMENT,
              name VARCHAR(120) NOT NULL,
              channel ENUM('web','ad','partner','event','word_of_mouth','other') NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS leads (
              id BIGINT PRIMARY KEY AUTO_INCREMENT,
              office_id BIGINT NOT NULL,
              customer_id BIGINT,
              referral_source_id BIGINT,
              status ENUM('new','contacted','qualified','converted','lost') NOT NULL,
              created_at DATETIME NOT NULL,
              FOREIGN KEY (office_id) REFERENCES offices(id),
              FOREIGN KEY (customer_id) REFERENCES customers(id),
              FOREIGN KEY (referral_source_id) REFERENCES referral_sources(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS jobs (
              id BIGINT PRIMARY KEY AUTO_INCREMENT,
              office_id BIGINT NOT NULL,
              customer_id BIGINT NOT NULL,
              sales_rep_user_id BIGINT,
              job_number VARCHAR(50) UNIQUE,
              status ENUM('estimate','scheduled','in_progress','completed','closed_won','closed_lost','cancelled') NOT NULL,
              job_type ENUM('residential','commercial','emergency','maintenance') NOT NULL,
              total_contract_amount DECIMAL(10,2),
              created_at DATETIME NOT NULL,
              scheduled_start DATETIME,
              scheduled_end DATETIME,
              closed_at DATETIME,
              FOREIGN KEY (office_id) REFERENCES offices(id),
              FOREIGN KEY (customer_id) REFERENCES customers(id),
              FOREIGN KEY (sales_rep_user_id) REFERENCES users(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS appointments (
              id BIGINT PRIMARY KEY AUTO_INCREMENT,
              office_id BIGINT NOT NULL,
              customer_id BIGINT,
              sales_rep_user_id BIGINT,
              scheduled_at DATETIME NOT NULL,
              outcome ENUM('scheduled','completed','cancelled','no_show') NOT NULL,
              converted_to_job TINYINT(1) DEFAULT 0,
              FOREIGN KEY (office_id) REFERENCES offices(id),
              FOREIGN KEY (customer_id) REFERENCES customers(id),
              FOREIGN KEY (sales_rep_user_id) REFERENCES users(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS invoices (
              id BIGINT PRIMARY KEY AUTO_INCREMENT,
              job_id BIGINT NOT NULL,
              invoice_number VARCHAR(50) UNIQUE,
              status ENUM('draft','sent','paid','overdue','partial','cancelled') NOT NULL,
              issue_date DATE NOT NULL,
              due_date DATE NOT NULL,
              total_amount DECIMAL(10,2) NOT NULL,
              FOREIGN KEY (job_id) REFERENCES jobs(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS tax_jurisdictions (
              id BIGINT PRIMARY KEY AUTO_INCREMENT,
              name VARCHAR(120) NOT NULL,
              rate DECIMAL(5,4) NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS invoice_line_items (
              id BIGINT PRIMARY KEY AUTO_INCREMENT,
              invoice_id BIGINT NOT NULL,
              tax_jurisdiction_id BIGINT,
              description TEXT,
              quantity DECIMAL(8,2) NOT NULL,
              unit_price DECIMAL(8,2) NOT NULL,
              FOREIGN KEY (invoice_id) REFERENCES invoices(id),
              FOREIGN KEY (tax_jurisdiction_id) REFERENCES tax_jurisdictions(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS payment_applications (
              id BIGINT PRIMARY KEY AUTO_INCREMENT,
              invoice_id BIGINT NOT NULL,
              payment_date DATE NOT NULL,
              amount_applied DECIMAL(10,2) NOT NULL,
              payment_method ENUM('cash','check','credit_card','bank_transfer') NOT NULL,
              FOREIGN KEY (invoice_id) REFERENCES invoices(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS commissions (
              id BIGINT PRIMARY KEY AUTO_INCREMENT,
              rep_user_id BIGINT NOT NULL,
              job_id BIGINT NOT NULL,
              period_month DATE NOT NULL,
              basis_amount DECIMAL(10,2) NOT NULL,
              rate DECIMAL(5,4) NOT NULL,
              amount DECIMAL(10,2) NOT NULL,
              FOREIGN KEY (rep_user_id) REFERENCES users(id),
              FOREIGN KEY (job_id) REFERENCES jobs(id)
            )
            """
        ]
        
        for command in schema_commands:
            try:
                self.cursor.execute(command)
                print(".", end="", flush=True)
            except Error as e:
                print(f"\nError creating table: {e}")
        
        self.connection.commit()
        print("\nTables created successfully")
    
    def clear_tables(self):
        """Clear all tables for fresh data generation"""
        tables = [
            'commissions', 'payment_applications', 'invoice_line_items', 
            'invoices', 'appointments', 'jobs', 'leads', 'customers', 
            'users', 'teams', 'tax_jurisdictions', 'referral_sources', 'offices'
        ]
        
        self.cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        for table in tables:
            self.cursor.execute(f"TRUNCATE TABLE {table}")
        self.cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        self.connection.commit()
        print("All tables cleared")
    
    def generate_offices(self, count=5):
        """Generate office records"""
        offices = []
        cities = [
            ('New York', 'America/New_York', 40.7128, -74.0060),
            ('Los Angeles', 'America/Los_Angeles', 34.0522, -118.2437),
            ('Chicago', 'America/Chicago', 41.8781, -87.6298),
            ('Houston', 'America/Chicago', 29.7604, -95.3698),
            ('Phoenix', 'America/Phoenix', 33.4484, -112.0740),
            ('Philadelphia', 'America/New_York', 39.9526, -75.1652),
            ('San Antonio', 'America/Chicago', 29.4241, -98.4936),
            ('San Diego', 'America/Los_Angeles', 32.7157, -117.1611),
            ('Dallas', 'America/Chicago', 32.7767, -96.7970),
            ('San Jose', 'America/Los_Angeles', 37.3382, -121.8863)
        ]
        
        for i in range(count):
            city_data = cities[i % len(cities)]
            office = (
                f"{city_data[0]} Office",
                city_data[1],
                city_data[2] + random.uniform(-0.1, 0.1),
                city_data[3] + random.uniform(-0.1, 0.1)
            )
            offices.append(office)
        
        query = "INSERT INTO offices (name, tz, latitude, longitude) VALUES (%s, %s, %s, %s)"
        self.cursor.executemany(query, offices)
        self.connection.commit()
        
        # Get the actual IDs that were inserted
        self.cursor.execute("SELECT id FROM offices ORDER BY id")
        office_ids = [row[0] for row in self.cursor.fetchall()]
        print(f"Generated {count} offices")
        return min(office_ids), max(office_ids)
    
    def generate_teams(self, office_start_id, office_end_id, teams_per_office=3):
        """Generate team records"""
        teams = []
        team_names = ['Sales Team', 'Service Team', 'Installation Team', 'Admin Team', 'Support Team']
        
        for office_id in range(office_start_id, office_end_id + 1):
            for i in range(teams_per_office):
                team = (office_id, team_names[i % len(team_names)])
                teams.append(team)
        
        query = "INSERT INTO teams (office_id, name) VALUES (%s, %s)"
        self.cursor.executemany(query, teams)
        self.connection.commit()
        
        # Get the actual IDs that were inserted
        self.cursor.execute("SELECT id FROM teams ORDER BY id")
        team_ids = [row[0] for row in self.cursor.fetchall()]
        print(f"Generated {len(teams)} teams")
        return min(team_ids), max(team_ids)
    
    def generate_users(self, office_start_id, office_end_id, team_start_id, team_end_id, users_per_office=10):
        """Generate user records"""
        users = []
        roles = ['admin', 'manager', 'rep', 'tech']
        role_weights = [0.1, 0.2, 0.4, 0.3]  # Distribution of roles
        
        for office_id in range(office_start_id, office_end_id + 1):
            # Calculate team range for this office
            teams_per_office = 3
            office_index = office_id - office_start_id
            office_team_start = team_start_id + (office_index * teams_per_office)
            office_team_end = office_team_start + teams_per_office - 1
            
            for i in range(users_per_office):
                role = random.choices(roles, weights=role_weights)[0]
                team_id = random.randint(office_team_start, office_team_end) if random.random() > 0.2 else None
                
                user = (
                    office_id,
                    team_id,
                    role,
                    fake.name(),
                    fake.email(),
                    1 if random.random() > 0.1 else 0  # 90% active users
                )
                users.append(user)
        
        query = "INSERT INTO users (office_id, team_id, role, full_name, email, active) VALUES (%s, %s, %s, %s, %s, %s)"
        self.cursor.executemany(query, users)
        self.connection.commit()
        
        # Get the actual IDs that were inserted
        self.cursor.execute("SELECT id FROM users ORDER BY id")
        user_ids = [row[0] for row in self.cursor.fetchall()]
        print(f"Generated {len(users)} users")
        return min(user_ids), max(user_ids)
    
    def generate_referral_sources(self):
        """Generate referral source records"""
        sources = [
            ('Google Ads', 'ad'),
            ('Facebook Marketing', 'ad'),
            ('Company Website', 'web'),
            ('Trade Show', 'event'),
            ('Partner Network', 'partner'),
            ('Word of Mouth', 'word_of_mouth'),
            ('Yellow Pages', 'other'),
            ('Direct Mail', 'other'),
            ('Radio Advertisement', 'ad'),
            ('Referral Program', 'partner')
        ]
        
        query = "INSERT INTO referral_sources (name, channel) VALUES (%s, %s)"
        self.cursor.executemany(query, sources)
        self.connection.commit()
        print(f"Generated {len(sources)} referral sources")
        return 1, len(sources)
    
    def generate_customers(self, office_start_id, office_end_id, customers_per_office=50):
        """Generate customer records"""
        customers = []
        
        for office_id in range(office_start_id, office_end_id + 1):
            for i in range(customers_per_office):
                created_at = fake.date_time_between(start_date='-2y', end_date='now')
                
                customer = (
                    office_id,
                    fake.name(),
                    fake.email() if random.random() > 0.2 else None,
                    fake.phone_number() if random.random() > 0.1 else None,
                    fake.street_address(),
                    fake.city(),
                    fake.state_abbr(),
                    fake.postcode(),
                    fake.latitude(),
                    fake.longitude(),
                    created_at
                )
                customers.append(customer)
        
        query = """INSERT INTO customers 
                   (office_id, full_name, email, phone, address1, city, state, postal_code, latitude, longitude, created_at) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
        self.cursor.executemany(query, customers)
        self.connection.commit()
        
        # Get the actual IDs that were inserted
        self.cursor.execute("SELECT id FROM customers ORDER BY id")
        customer_ids = [row[0] for row in self.cursor.fetchall()]
        print(f"Generated {len(customers)} customers")
        return min(customer_ids), max(customer_ids)
    
    def generate_leads(self, office_start_id, office_end_id, customer_start_id, customer_end_id, 
                      referral_start_id, referral_end_id, leads_per_office=30):
        """Generate lead records"""
        leads = []
        statuses = ['new', 'contacted', 'qualified', 'converted', 'lost']
        status_weights = [0.2, 0.3, 0.2, 0.2, 0.1]
        
        for office_id in range(office_start_id, office_end_id + 1):
            # Calculate customer range for this office
            customers_per_office = 50
            office_index = office_id - office_start_id
            office_customer_start = customer_start_id + (office_index * customers_per_office)
            office_customer_end = office_customer_start + customers_per_office - 1
            
            for i in range(leads_per_office):
                status = random.choices(statuses, weights=status_weights)[0]
                customer_id = random.randint(office_customer_start, office_customer_end)
                referral_id = random.randint(referral_start_id, referral_end_id)
                created_at = fake.date_time_between(start_date='-1y', end_date='now')
                
                lead = (office_id, customer_id, referral_id, status, created_at)
                leads.append(lead)
        
        query = "INSERT INTO leads (office_id, customer_id, referral_source_id, status, created_at) VALUES (%s, %s, %s, %s, %s)"
        self.cursor.executemany(query, leads)
        self.connection.commit()
        
        # Get the actual IDs that were inserted
        self.cursor.execute("SELECT id FROM leads ORDER BY id")
        lead_ids = [row[0] for row in self.cursor.fetchall()]
        print(f"Generated {len(leads)} leads")
        return min(lead_ids), max(lead_ids)
    
    def generate_jobs(self, office_start_id, office_end_id, customer_start_id, customer_end_id, 
                     user_start_id, user_end_id, jobs_per_office=40):
        """Generate job records"""
        jobs = []
        statuses = ['estimate', 'scheduled', 'in_progress', 'completed', 'closed_won', 'closed_lost', 'cancelled']
        status_weights = [0.15, 0.15, 0.1, 0.2, 0.25, 0.1, 0.05]
        job_types = ['residential', 'commercial', 'emergency', 'maintenance']
        
        for office_id in range(office_start_id, office_end_id + 1):
            # Calculate ranges for this office
            customers_per_office = 50
            users_per_office = 10
            office_index = office_id - office_start_id
            
            office_customer_start = customer_start_id + (office_index * customers_per_office)
            office_customer_end = office_customer_start + customers_per_office - 1
            office_user_start = user_start_id + (office_index * users_per_office)
            office_user_end = office_user_start + users_per_office - 1
            
            for i in range(jobs_per_office):
                status = random.choices(statuses, weights=status_weights)[0]
                job_type = random.choice(job_types)
                customer_id = random.randint(office_customer_start, office_customer_end)
                sales_rep_id = random.randint(office_user_start, office_user_end)
                
                created_at = fake.date_time_between(start_date='-18m', end_date='now')
                job_number = f"JOB-{office_id}-{i+1:04d}"
                
                # Generate contract amount based on job type
                if job_type == 'residential':
                    amount = random.uniform(500, 15000)
                elif job_type == 'commercial':
                    amount = random.uniform(2000, 50000)
                elif job_type == 'emergency':
                    amount = random.uniform(200, 8000)
                else:  # maintenance
                    amount = random.uniform(100, 3000)
                
                scheduled_start = None
                scheduled_end = None
                closed_at = None
                
                if status in ['scheduled', 'in_progress', 'completed', 'closed_won']:
                    scheduled_start = created_at + timedelta(days=random.randint(1, 30))
                    scheduled_end = scheduled_start + timedelta(hours=random.randint(2, 48))
                    
                    if status in ['completed', 'closed_won']:
                        closed_at = scheduled_end + timedelta(days=random.randint(0, 7))
                elif status in ['closed_lost', 'cancelled']:
                    closed_at = created_at + timedelta(days=random.randint(1, 60))
                
                job = (
                    office_id, customer_id, sales_rep_id, job_number, status, 
                    job_type, amount, created_at, scheduled_start, scheduled_end, closed_at
                )
                jobs.append(job)
        
        query = """INSERT INTO jobs 
                   (office_id, customer_id, sales_rep_user_id, job_number, status, job_type, 
                    total_contract_amount, created_at, scheduled_start, scheduled_end, closed_at) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
        self.cursor.executemany(query, jobs)
        self.connection.commit()
        
        # Get the actual IDs that were inserted
        self.cursor.execute("SELECT id FROM jobs ORDER BY id")
        job_ids = [row[0] for row in self.cursor.fetchall()]
        print(f"Generated {len(jobs)} jobs")
        return min(job_ids), max(job_ids)
    
    def generate_all_mock_data(self):
        """Generate all mock data in proper order"""
        print("Starting mock data generation...")
        
        # Generate base entities
        office_start, office_end = self.generate_offices(5)
        team_start, team_end = self.generate_teams(office_start, office_end)
        user_start, user_end = self.generate_users(office_start, office_end, team_start, team_end)
        referral_start, referral_end = self.generate_referral_sources()
        
        # Generate customer-related data
        customer_start, customer_end = self.generate_customers(office_start, office_end)
        lead_start, lead_end = self.generate_leads(office_start, office_end, customer_start, customer_end, 
                                                  referral_start, referral_end)
        job_start, job_end = self.generate_jobs(office_start, office_end, customer_start, customer_end, 
                                               user_start, user_end)
        
        print("Mock data generation completed successfully!")

def main():
    parser = argparse.ArgumentParser(description='Generate mock data for Leap project')
    parser.add_argument('--host', default='localhost', help='MySQL host (default: localhost)')
    parser.add_argument('--database', default='leap_mock', help='Database name (default: leap_mock)')
    parser.add_argument('--user', default='root', help='MySQL user (default: root)')
    parser.add_argument('--password', default='', help='MySQL password (default: empty)')
    parser.add_argument('--create-schema', action='store_true', help='Create database schema')
    parser.add_argument('--clear-data', action='store_true', help='Clear existing data before generating')
    
    args = parser.parse_args()
    
    generator = MockDataGenerator(
        host=args.host,
        database=args.database,
        user=args.user,
        password=args.password
    )
    
    try:
        generator.connect()
        
        if args.create_schema:
            print("Creating database schema...")
            generator.execute_schema()
        
        if args.clear_data:
            print("Clearing existing data...")
            generator.clear_tables()
        
        generator.generate_all_mock_data()
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        generator.disconnect()

if __name__ == "__main__":
    main()
