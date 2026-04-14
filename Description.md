This is a comprehensive blueprint for your **Rainbow Play School ERP**. By moving to this XML-structured approach, we ensure that the logic is decoupled: your "Company" data drives the UI, and your "Master" data drives the "Transaction" logic.

Here is the functional breakdown of how every feature will work, followed by the technical deliverables.

---

## 1. Functional Feature Description

### **A. Company Profile & Dynamic Branding**

- **How it works:** This is your "System Identity." You upload your school logo and enter details once.
- **The Magic:** Instead of hardcoding "Rainbow Play School" into your forms, the software pulls the `FirmName` and `LogoPath` from the database. If you change your phone number here, it updates on the dashboard, the admission forms, and the ID cards automatically.

### **B. Master Settings (The Control Room)**

- **Financial Year:** You define years (e.g., 2026-27). When you mark one as "Active," the invoice generator automatically picks up the `26-27` string for new receipts.
- **Class Master:** You add classes (Nursery, Jr. KG). You attach a "Base Fee" and "Session Time" to each.
- **Workflow:** When you register a student later and select "Nursery," the software automatically knows to charge them $₹15,000$ (or whatever you set) without you typing it manually.

### **C. The Registration & Photo Module**

- **Form Entry:** Replicates the paper form fields.
- **Photo Capture:** You can either click "Upload" to pick a file or "Capture" to open the webcam.
- **Local Storage:** The software saves the image to a hidden folder in `%AppData%`. This keeps the database small and fast while ensuring photos are never lost if you move the app.

### **D. Fee Ledger & Smart Invoicing**

- **Ledger:** Every student has a personal "Account." You see: `Total Fee - Paid = Balance`.
- **Invoice Logic:** When a parent pays, the system looks at the current year and the last invoice number in the database. It increments it (e.g., 001 becomes 002) and creates the string `RK/26-27/002`.
- **Part Payments:** You can record ₹2,000 today and ₹5,000 next month; the ledger tracks the dates and remaining balance.

### **E. PDF Overlay & ID Card Engine**

- **Admission Form:** The software takes a digital "background image" of your blank paper form. It then "stamps" the student's typed data and photo onto the exact coordinates of that image.
- **ID Cards:** A separate template that pulls the `PhotoPath` and `StudentName`. It generates a high-resolution PDF ready for a PVC card printer.

---

## 2. Technical Deliverables

### **I. SQLite Schema (The Foundation)**

Analyse this schema and improve it.

```sql
-- Master Tables
CREATE TABLE Company_Profile (
    id INTEGER PRIMARY KEY DEFAULT 1,
    firm_name TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_path TEXT,
    gst_no TEXT
);

CREATE TABLE Financial_Years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year_label TEXT, -- e.g., "26-27"
    is_active BOOLEAN DEFAULT 0
);

CREATE TABLE Classes_Master (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_name TEXT,
    session_time TEXT,
    base_fee REAL,
    year_id INTEGER,
    FOREIGN KEY(year_id) REFERENCES Financial_Years(id)
);

-- Transaction Tables
CREATE TABLE Students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photo_path TEXT,
    full_name TEXT,
    dob DATE,
    class_id INTEGER,
    religion TEXT,
    caste TEXT,
    address TEXT,
    father_name TEXT,
    mother_name TEXT,
    emergency_contact TEXT,
    admission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(class_id) REFERENCES Classes_Master(id)
);

CREATE TABLE Payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    invoice_no TEXT,
    amount_paid REAL,
    payment_date DATE,
    balance_left REAL,
    FOREIGN KEY(student_id) REFERENCES Students(id)
);
```

### **IV. PDF Generation Strategy**

I want native PDF generation. Meaning the pdf generated should be a selecteable text and not a image.
I will mannaully set the pdf format for the fees and the form just right now create pages.
Use react-pdf/renderer create a format page with the ful information

---

### **A Note on "Absolute Mode" Deployment**

Since we are building this for a high-stakes environment:

- **Operational Risk:** If the Windows PC crashes, you lose your database. **Solution:** Add a "Backup to Drive/USB" button in the Settings that copies the `school.db` file.
- **Logical Gap:** Ensure that once an invoice is generated, it cannot be deleted—only "Cancelled." This prevents staff from deleting payment records to hide cash.

Does this functional map and technical structure align with your vision for **S V IT Hub's** school project?
