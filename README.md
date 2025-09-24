Project Setup Guide

Follow these instructions to clone and run the full-stack authentication project locally on your machine.
Part 1: Prerequisites

Before you begin, make sure you have the following software installed:

    Git: For cloning the repository.

    Node.js: (Version 18 or later recommended).

    XAMPP: For running the Apache server and MySQL database.

    A Code Editor: We recommend using Visual Studio Code.

Part 2: Clone the Project

    Open your terminal or command prompt.

    Clone the project repository from GitHub by running the following command. Replace <your-repository-url> with the actual URL of your GitHub project.
    code Bash

    
git clone <your-repository-url>

  

Navigate into the newly created project folder:
code Bash

        
    cd <project-folder-name>

      

Part 3: Set Up the Database (XAMPP)

    Start XAMPP: Open the XAMPP Control Panel and start the Apache and MySQL modules.

    Open phpMyAdmin: Click the "Admin" button for MySQL. This will open phpMyAdmin in your browser (usually at http://localhost/phpmyadmin).

    Create the Database:

        In phpMyAdmin, click "New" on the left sidebar.

        For the Database name, enter midterm_auth.

        For the Collation, select utf8mb4_general_ci.

        Click "Create".

    Create the users Table:

        Click on the midterm_auth database you just created in the left sidebar.

        Click on the "SQL" tab at the top.

        Copy the entire SQL code block below and paste it into the SQL query box:
    code SQL

        
    CREATE TABLE `users` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `email` varchar(255) NOT NULL,
      `password` varchar(255) NOT NULL,
      `name` varchar(255) DEFAULT NULL,
      `username` varchar(50) DEFAULT NULL,
      `onboarded` tinyint(1) DEFAULT 0,
      `image` varchar(255) DEFAULT NULL,
      `resetToken` varchar(255) DEFAULT NULL,
      `resetTokenExpiry` datetime DEFAULT NULL,
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (`id`),
      UNIQUE KEY `email` (`email`),
      UNIQUE KEY `username` (`username`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

      

        Click the "Go" button at the bottom right.

You should see a success message. Your database is now ready.
Part 4: Set Up the Backend Server

    In your terminal, navigate to the backend directory:
    code Bash

    
cd backend

  

Install all the necessary Node.js packages:
code Bash

    
npm install

  

Create an Environment File:

    In the backend folder, create a new file named .env.

    Copy and paste the following content into the .env file. The values are pre-filled for a standard XAMPP setup.

code Env

        
    # --- Database Configuration ---
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=
    DB_DATABASE=midterm_auth

    # --- Security ---
    # Generate your own long, random string for the JWT secret
    JWT_SECRET=YOUR_OWN_SUPER_SECRET_RANDOM_STRING_HERE

    # --- Nodemailer (Optional - for sending real emails) ---
    # EMAIL_USER=your-email@gmail.com
    # EMAIL_PASS=your-gmail-app-password

      

        Important: Replace YOUR_OWN_SUPER_SECRET_RANDOM_STRING_HERE with your own unique, random secret phrase.

Part 5: Set Up the Frontend Application

    In your terminal, navigate to the frontend directory:
    code Bash

    
cd ../frontend

  

Install all the necessary Node.js packages:
code Bash

    
npm install

  

Create an Environment File:

    In the frontend folder, create a new file named .env.local.

    Copy and paste the following content into it.

code Env

        
    # --- Google OAuth Credentials ---
    # You MUST get your own credentials from the Google Cloud Console for Google Login to work.
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=
    NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=

    # --- NextAuth.js Configuration ---
    # Generate another long, random string for the NextAuth secret.
    NEXTAUTH_SECRET=ANOTHER_DIFFERENT_SUPER_SECRET_RANDOM_STRING

      

        Important: Each team member must get their own Google Client ID and Secret from the Google Cloud Console for Google Sign-In to work. The NEXTAUTH_SECRET can be any random string.

Part 6: Run the Project

You need to have two terminals open simultaneously to run both the frontend and backend servers.

    Terminal 1: Start the Backend
    code Bash

    
cd backend
npm start

  

You should see the message: Backend server listening at http://localhost:5000

Terminal 2: Start the Frontend
code Bash

    
cd frontend
npm run dev

  

You should see a message indicating the server is ready at http://localhost:3000
