#!/usr/bin/env python3
"""
Database Seeder for IntelliQuiz
Populates all tables with realistic test data including a specific superadmin user.
"""

import psycopg2
from psycopg2.extras import execute_values
import bcrypt
from datetime import datetime, timedelta
import random
import os

# Database connection parameters
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5434'),
    'database': os.getenv('DB_NAME', 'intelliquiz'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'mysecretpassword')
}

def hash_password(password: str) -> str:
    """Hash password using BCrypt (compatible with Spring Security)"""
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def clear_database(cursor):
    """Clear all existing data from tables in correct order (respecting foreign keys)"""
    print("🗑️  Clearing existing data...")
    
    tables_to_clear = [
        'assignment_permission',
        'submission',
        'question_option',
        'question',
        'team',
        'quiz_assignment',
        'backup_record',
        'quiz',
        '"user"'
    ]
    
    for table in tables_to_clear:
        cursor.execute(f'DELETE FROM {table}')
    
    # Reset sequences
    sequences = [
        'user_id_seq',
        'quiz_id_seq',
        'question_id_seq',
        'team_id_seq',
        'submission_id_seq',
        'quiz_assignment_id_seq',
        'backup_record_id_seq'
    ]
    
    for seq in sequences:
        cursor.execute(f'ALTER SEQUENCE {seq} RESTART WITH 1')
    
    print("✓ Database cleared")

def seed_users(cursor):
    """Create users including the specific superadmin"""
    print("\n👥 Seeding users...")
    
    users = [
        # Required superadmin
        ('superadminsimone', hash_password('simone123'), 'SUPER_ADMIN'),
        
        # Additional superadmins
        ('admin_master', hash_password('admin123'), 'SUPER_ADMIN'),
        ('system_admin', hash_password('system123'), 'SUPER_ADMIN'),
        
        # Regular admins
        ('john_teacher', hash_password('teacher123'), 'ADMIN'),
        ('sarah_educator', hash_password('educator123'), 'ADMIN'),
        ('mike_instructor', hash_password('instructor123'), 'ADMIN'),
        ('emma_prof', hash_password('prof123'), 'ADMIN'),
    ]
    
    cursor.execute('''
        INSERT INTO "user" (username, password, system_role)
        VALUES (%s, %s, %s)
        RETURNING id
    ''', users[0])
    
    user_ids = [cursor.fetchone()[0]]
    
    for user in users[1:]:
        cursor.execute('''
            INSERT INTO "user" (username, password, system_role)
            VALUES (%s, %s, %s)
            RETURNING id
        ''', user)
        user_ids.append(cursor.fetchone()[0])
    
    print(f"✓ Created {len(users)} users")
    return user_ids

def seed_quizzes(cursor):
    """Create quizzes with varied content"""
    print("\n📝 Seeding quizzes...")
    
    quizzes = [
        ('Python Programming Basics', 'Test your knowledge of Python fundamentals', True, 'PIN1234', 'READY'),
        ('Advanced Java Concepts', 'Deep dive into Java OOP and design patterns', False, 'PIN5678', 'READY'),
        ('Database Design Quiz', 'SQL and database normalization questions', True, 'PIN9012', 'DRAFT'),
        ('Web Development Fundamentals', 'HTML, CSS, and JavaScript basics', True, 'PIN3456', 'READY'),
        ('Data Structures & Algorithms', 'Classic CS problems and solutions', False, 'PIN7890', 'ARCHIVED'),
        ('Spring Boot Mastery', 'Spring framework and microservices', True, 'PIN2468', 'READY'),
        ('React & Frontend Development', 'Modern frontend development practices', False, 'PIN1357', 'DRAFT'),
    ]
    
    quiz_ids = []
    for quiz in quizzes:
        cursor.execute('''
            INSERT INTO quiz (title, description, is_live_session, proctor_pin, status)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        ''', quiz)
        quiz_ids.append(cursor.fetchone()[0])
    
    print(f"✓ Created {len(quizzes)} quizzes")
    return quiz_ids

def seed_questions(cursor, quiz_ids):
    """Create questions for each quiz"""
    print("\n❓ Seeding questions...")
    
    question_templates = {
        'Python Programming Basics': [
            ('What is the output of print(type([]))?', 'MULTIPLE_CHOICE', 'EASY', 10, '<class \'list\'>', 30, ['<class \'list\'>', '<class \'dict\'>', '<class \'tuple\'>', '<class \'set\'>']),
            ('Which keyword is used to define a function in Python?', 'MULTIPLE_CHOICE', 'EASY', 10, 'def', 30, ['def', 'function', 'func', 'define']),
            ('What does the len() function return?', 'IDENTIFICATION', 'MEDIUM', 15, 'length', 45, []),
            ('Explain list comprehension in Python', 'IDENTIFICATION', 'HARD', 25, 'concise way to create lists', 60, []),
            ('What is the difference between == and is?', 'MULTIPLE_CHOICE', 'MEDIUM', 15, '== compares values, is compares identity', 45, ['== compares values, is compares identity', 'They are the same', '== is faster', 'is compares values']),
            ('What is a lambda function?', 'IDENTIFICATION', 'HARD', 25, 'anonymous function', 60, []),
        ],
        'Advanced Java Concepts': [
            ('What is polymorphism?', 'IDENTIFICATION', 'MEDIUM', 15, 'ability to take many forms', 45, []),
            ('Which design pattern ensures only one instance?', 'MULTIPLE_CHOICE', 'MEDIUM', 15, 'Singleton', 45, ['Singleton', 'Factory', 'Observer', 'Strategy']),
            ('What is the purpose of the final keyword?', 'MULTIPLE_CHOICE', 'EASY', 10, 'Prevents modification', 30, ['Prevents modification', 'Increases speed', 'Adds security', 'None']),
            ('Explain dependency injection', 'IDENTIFICATION', 'HARD', 25, 'design pattern for loose coupling', 60, []),
            ('What is method overloading?', 'MULTIPLE_CHOICE', 'EASY', 10, 'Same name, different parameters', 30, ['Same name, different parameters', 'Same signature', 'Different name', 'None']),
        ],
        'Database Design Quiz': [
            ('What is normalization?', 'IDENTIFICATION', 'MEDIUM', 15, 'organizing data to reduce redundancy', 45, []),
            ('Which normal form eliminates transitive dependencies?', 'MULTIPLE_CHOICE', 'HARD', 25, '3NF', 60, ['3NF', '1NF', '2NF', 'BCNF']),
            ('What is a foreign key?', 'MULTIPLE_CHOICE', 'EASY', 10, 'References primary key in another table', 30, ['References primary key in another table', 'Unique identifier', 'Index', 'Constraint']),
            ('What does ACID stand for?', 'IDENTIFICATION', 'MEDIUM', 15, 'Atomicity Consistency Isolation Durability', 45, []),
            ('Explain the purpose of indexes', 'IDENTIFICATION', 'HARD', 25, 'improve query performance', 60, []),
        ],
        'Web Development Fundamentals': [
            ('What does HTML stand for?', 'MULTIPLE_CHOICE', 'EASY', 10, 'HyperText Markup Language', 30, ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'None']),
            ('Which CSS property controls text size?', 'MULTIPLE_CHOICE', 'EASY', 10, 'font-size', 30, ['font-size', 'text-size', 'size', 'font-style']),
            ('What is the DOM?', 'IDENTIFICATION', 'MEDIUM', 15, 'Document Object Model', 45, []),
            ('Explain event bubbling', 'IDENTIFICATION', 'HARD', 25, 'event propagation from child to parent', 60, []),
            ('What is the box model?', 'MULTIPLE_CHOICE', 'MEDIUM', 15, 'Content, padding, border, margin', 45, ['Content, padding, border, margin', 'Only content', 'Width and height', 'None']),
        ],
        'Data Structures & Algorithms': [
            ('What is Big O notation?', 'IDENTIFICATION', 'MEDIUM', 15, 'describes algorithm complexity', 45, []),
            ('Which data structure uses LIFO?', 'MULTIPLE_CHOICE', 'EASY', 10, 'Stack', 30, ['Stack', 'Queue', 'Array', 'Tree']),
            ('What is the time complexity of binary search?', 'MULTIPLE_CHOICE', 'MEDIUM', 15, 'O(log n)', 45, ['O(log n)', 'O(n)', 'O(n^2)', 'O(1)']),
            ('Explain dynamic programming', 'IDENTIFICATION', 'HARD', 25, 'optimization technique using memoization', 60, []),
            ('What is a hash collision?', 'MULTIPLE_CHOICE', 'MEDIUM', 15, 'Two keys map to same index', 45, ['Two keys map to same index', 'Hash function error', 'Memory overflow', 'None']),
        ],
        'Spring Boot Mastery': [
            ('What is dependency injection in Spring?', 'IDENTIFICATION', 'MEDIUM', 15, 'IoC container manages dependencies', 45, []),
            ('Which annotation marks a REST controller?', 'MULTIPLE_CHOICE', 'EASY', 10, '@RestController', 30, ['@RestController', '@Controller', '@Service', '@Component']),
            ('What is Spring Boot Auto-configuration?', 'IDENTIFICATION', 'HARD', 25, 'automatic configuration based on classpath', 60, []),
            ('Explain @Transactional annotation', 'IDENTIFICATION', 'HARD', 25, 'manages database transactions', 60, []),
            ('What is the purpose of application.properties?', 'MULTIPLE_CHOICE', 'EASY', 10, 'Configuration settings', 30, ['Configuration settings', 'Code storage', 'Database', 'None']),
        ],
        'React & Frontend Development': [
            ('What is JSX?', 'IDENTIFICATION', 'EASY', 10, 'JavaScript XML syntax extension', 30, []),
            ('Which hook manages state?', 'MULTIPLE_CHOICE', 'EASY', 10, 'useState', 30, ['useState', 'useEffect', 'useContext', 'useRef']),
            ('What is virtual DOM?', 'IDENTIFICATION', 'MEDIUM', 15, 'in-memory representation of real DOM', 45, []),
            ('Explain component lifecycle', 'IDENTIFICATION', 'HARD', 25, 'mounting updating unmounting phases', 60, []),
            ('What is prop drilling?', 'MULTIPLE_CHOICE', 'MEDIUM', 15, 'Passing props through multiple levels', 45, ['Passing props through multiple levels', 'State management', 'Component nesting', 'None']),
        ],
    }
    
    question_count = 0
    question_ids_by_quiz = {}
    
    for quiz_id in quiz_ids:
        cursor.execute('SELECT title FROM quiz WHERE id = %s', (quiz_id,))
        quiz_title = cursor.fetchone()[0]
        
        questions = question_templates.get(quiz_title, [])
        if not questions:
            # Use default questions if template not found
            questions = question_templates['Python Programming Basics']
        
        question_ids_by_quiz[quiz_id] = []
        
        for idx, (text, q_type, difficulty, points, correct_key, time_limit, options) in enumerate(questions):
            cursor.execute('''
                INSERT INTO question (text, type, difficulty, points, correct_key, time_limit, quiz_id, order_index)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            ''', (text, q_type, difficulty, points, correct_key, time_limit, quiz_id, idx))
            
            question_id = cursor.fetchone()[0]
            question_ids_by_quiz[quiz_id].append(question_id)
            question_count += 1
            
            # Add options for multiple choice questions
            if options:
                for option in options:
                    cursor.execute('''
                        INSERT INTO question_option (question_id, option_text)
                        VALUES (%s, %s)
                    ''', (question_id, option))
    
    print(f"✓ Created {question_count} questions")
    return question_ids_by_quiz

def seed_teams(cursor, quiz_ids):
    """Create teams for each quiz"""
    print("\n👥 Seeding teams...")
    
    team_names = [
        'Code Warriors', 'Debug Dragons', 'Syntax Slayers',
        'Algorithm Aces', 'Binary Beasts', 'Logic Legends',
        'Tech Titans', 'Pixel Pirates', 'Data Dynamos'
    ]
    
    team_count = 0
    teams_by_quiz = {}
    
    for quiz_id in quiz_ids:
        teams_by_quiz[quiz_id] = []
        num_teams = random.randint(3, 5)
        
        for i in range(num_teams):
            team_name = random.choice(team_names)
            access_code = f'TEAM{quiz_id}{i:02d}'
            total_score = random.randint(0, 100) if random.random() > 0.3 else 0
            
            cursor.execute('''
                INSERT INTO team (name, access_code, total_score, quiz_id)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            ''', (team_name, access_code, total_score, quiz_id))
            
            team_id = cursor.fetchone()[0]
            teams_by_quiz[quiz_id].append(team_id)
            team_count += 1
    
    print(f"✓ Created {team_count} teams")
    return teams_by_quiz

def seed_submissions(cursor, teams_by_quiz, question_ids_by_quiz):
    """Create submissions for teams"""
    print("\n📤 Seeding submissions...")
    
    submission_count = 0
    base_time = datetime.now() - timedelta(days=7)
    
    for quiz_id, team_ids in teams_by_quiz.items():
        question_ids = question_ids_by_quiz.get(quiz_id, [])
        
        for team_id in team_ids:
            # Each team submits answers to 60-80% of questions
            num_submissions = int(len(question_ids) * random.uniform(0.6, 0.8))
            selected_questions = random.sample(question_ids, num_submissions)
            
            for idx, question_id in enumerate(selected_questions):
                # Get question details
                cursor.execute('''
                    SELECT correct_key, points, type FROM question WHERE id = %s
                ''', (question_id,))
                correct_key, points, q_type = cursor.fetchone()
                
                # 70% chance of correct answer
                is_correct = random.random() < 0.7
                submitted_answer = correct_key if is_correct else 'wrong answer'
                awarded_points = points if is_correct else 0
                
                submitted_at = base_time + timedelta(minutes=idx * 2)
                
                cursor.execute('''
                    INSERT INTO submission (
                        submitted_answer, is_correct, awarded_points, 
                        is_graded, submitted_at, question_id, team_id
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                ''', (submitted_answer, is_correct, awarded_points, True, submitted_at, question_id, team_id))
                
                submission_count += 1
    
    print(f"✓ Created {submission_count} submissions")

def seed_quiz_assignments(cursor, user_ids, quiz_ids):
    """Create quiz assignments linking users to quizzes"""
    print("\n📋 Seeding quiz assignments...")
    
    assignment_count = 0
    assignment_ids = []
    
    # Superadmin gets assigned to all quizzes
    superadmin_id = user_ids[0]
    for quiz_id in quiz_ids:
        cursor.execute('''
            INSERT INTO quiz_assignment (user_id, quiz_id)
            VALUES (%s, %s)
            RETURNING id
        ''', (superadmin_id, quiz_id))
        assignment_ids.append(cursor.fetchone()[0])
        assignment_count += 1
    
    # Other users get assigned to random quizzes
    for user_id in user_ids[1:]:
        num_assignments = random.randint(2, 4)
        selected_quizzes = random.sample(quiz_ids, min(num_assignments, len(quiz_ids)))
        
        for quiz_id in selected_quizzes:
            cursor.execute('''
                INSERT INTO quiz_assignment (user_id, quiz_id)
                VALUES (%s, %s)
                RETURNING id
            ''', (user_id, quiz_id))
            assignment_ids.append(cursor.fetchone()[0])
            assignment_count += 1
    
    print(f"✓ Created {assignment_count} quiz assignments")
    return assignment_ids

def seed_assignment_permissions(cursor, assignment_ids):
    """Create permissions for quiz assignments"""
    print("\n🔐 Seeding assignment permissions...")
    
    permissions = ['CAN_VIEW_DETAILS', 'CAN_EDIT_CONTENT', 'CAN_MANAGE_TEAMS', 'CAN_HOST_GAME']
    permission_count = 0
    
    for assignment_id in assignment_ids:
        # First few assignments (superadmin) get all permissions
        if assignment_id <= len(assignment_ids) // 7:  # Roughly superadmin's assignments
            selected_permissions = permissions
        else:
            # Others get random subset of permissions
            num_perms = random.randint(1, 3)
            selected_permissions = random.sample(permissions, num_perms)
        
        for perm in selected_permissions:
            cursor.execute('''
                INSERT INTO assignment_permission (assignment_id, permission)
                VALUES (%s, %s)
            ''', (assignment_id, perm))
            permission_count += 1
    
    print(f"✓ Created {permission_count} assignment permissions")

def print_summary(cursor):
    """Print summary of seeded data"""
    print("\n" + "="*60)
    print("📊 SEEDING SUMMARY")
    print("="*60)
    
    tables = [
        ('user', 'Users'),
        ('quiz', 'Quizzes'),
        ('question', 'Questions'),
        ('team', 'Teams'),
        ('submission', 'Submissions'),
        ('quiz_assignment', 'Quiz Assignments'),
        ('assignment_permission', 'Assignment Permissions'),
    ]
    
    for table, label in tables:
        cursor.execute(f'SELECT COUNT(*) FROM {table}')
        count = cursor.fetchone()[0]
        print(f"  {label:.<30} {count:>5}")
    
    print("="*60)
    print("\n✅ Database seeding completed successfully!")
    print("\n🔑 Superadmin Credentials:")
    print("   Username: superadminsimone")
    print("   Password: simone123")
    print("="*60)

def main():
    """Main seeder function"""
    print("\n" + "="*60)
    print("🌱 IntelliQuiz Database Seeder")
    print("="*60)
    
    try:
        # Connect to database
        print(f"\n🔌 Connecting to database at {DB_CONFIG['host']}:{DB_CONFIG['port']}...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✓ Connected successfully")
        
        # Clear existing data
        clear_database(cursor)
        
        # Seed data in order
        user_ids = seed_users(cursor)
        quiz_ids = seed_quizzes(cursor)
        question_ids_by_quiz = seed_questions(cursor, quiz_ids)
        teams_by_quiz = seed_teams(cursor, quiz_ids)
        seed_submissions(cursor, teams_by_quiz, question_ids_by_quiz)
        assignment_ids = seed_quiz_assignments(cursor, user_ids, quiz_ids)
        seed_assignment_permissions(cursor, assignment_ids)
        
        # Commit transaction
        conn.commit()
        
        # Print summary
        print_summary(cursor)
        
        # Close connection
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        if 'conn' in locals():
            conn.rollback()
        raise

if __name__ == '__main__':
    main()
