# Data Analysis Report

## 1. GruposDosUsuarios20250508102637.csv Analysis

### 1.1 File Overview
- Number of records: 10
- Columns: Nome, CRM, UF, Email, Telefone, Grupo, Qualificacoes, DataCertificacao, ValidadeCertificacao

### 1.2 Column Analysis
#### Nome
- Data type: Text
- Unique values: 10
- Missing values: 0

#### CRM
- Data type: int64
- Min: 12345
- Max: 901234
- Missing values: 0

#### UF
- Data type: Text
- Unique values: 3
- Values: SP, RJ, MG
- Missing values: 0

#### Email
- Data type: Text
- Unique values: 10
- Missing values: 0

#### Telefone
- Data type: Text
- Unique values: 10
- Missing values: 0

#### Grupo
- Data type: Text
- Unique values: 3
- Values: Grupo A, Grupo B, Grupo C
- Missing values: 0

#### Qualificacoes
- Data type: Text
- Unique values: 9
- Values: UTI Adulto, Cardiologia, UTI Adulto, Pneumologia, UTI Adulto, Neurologia, UTI Pediátrica, Emergência, UTI Adulto, Nefrologia, UTI Adulto, UTI Pediátrica, UTI Adulto, Infectologia, UTI Adulto, Emergência, UTI Pediátrica, Neonatologia
- Missing values: 0

#### DataCertificacao
- Data type: Text
- Unique values: 10
- Missing values: 0

#### ValidadeCertificacao
- Data type: Text
- Unique values: 10
- Missing values: 0

### 1.3 Group Distribution
- Grupo A: 4 doctors
- Grupo B: 3 doctors
- Grupo C: 3 doctors

### 1.4 Qualifications Analysis
- UTI Adulto: 8 doctors
- UTI Pediátrica: 3 doctors
- Cardiologia: 2 doctors
- Emergência: 2 doctors
- Pneumologia: 1 doctors
- Neurologia: 1 doctors
- Nefrologia: 1 doctors
- Infectologia: 1 doctors
- Neonatologia: 1 doctors

## 2. PlantoesPrevistoVSRealizado20250508121341.csv Analysis

### 2.1 File Overview
- Number of records: 20
- Columns: Profissional, CRM, Previsto, Realizado, Saldo, Periodo

### 2.2 Column Analysis
#### Profissional
- Data type: Text
- Unique values: 10
- Missing values: 0

#### CRM
- Data type: int64
- Min: 12345
- Max: 901234
- Missing values: 0

#### Previsto
- Data type: int64
- Min: 8
- Max: 18
- Missing values: 0

#### Realizado
- Data type: int64
- Min: 9
- Max: 16
- Missing values: 0

#### Saldo
- Data type: int64
- Min: -3
- Max: 2
- Missing values: 0

#### Periodo
- Data type: Text
- Unique values: 2
- Values: 2025-01-01 a 2025-03-31, 2025-04-01 a 2025-04-30
- Missing values: 0

### 2.3 Shift Balance Analysis
- Average expected shifts per doctor: 13.35
- Average actual shifts per doctor: 13.25
- Average balance: -0.10
- Doctors with positive balance: 8
- Doctors with negative balance: 6
- Doctors with neutral balance: 6

### 2.4 Period Analysis
- Number of distinct periods: 2
- Period 2025-01-01 a 2025-03-31:
  - Records: 10
  - Total expected shifts: 140
  - Total actual shifts: 138
  - Overall balance: -2
- Period 2025-04-01 a 2025-04-30:
  - Records: 10
  - Total expected shifts: 127
  - Total actual shifts: 127
  - Overall balance: 0

## 3. Database Schema Recommendations

Based on the analysis of the provided data files and the requirements for the doctor recertification and ICU shift scheduling application, the following database schema is recommended:

### 3.1 Core Tables
1. **users** - Store doctor information
   - user_id (PK)
   - name
   - crm_number
   - crm_state
   - email
   - phone
   - created_at
   - updated_at

2. **qualifications** - Store qualification types
   - qualification_id (PK)
   - name
   - description

3. **user_qualifications** - Map users to qualifications
   - user_qualification_id (PK)
   - user_id (FK)
   - qualification_id (FK)
   - certification_date
   - expiration_date

4. **groups** - Store user groups
   - group_id (PK)
   - name
   - description

5. **user_groups** - Map users to groups
   - user_group_id (PK)
   - user_id (FK)
   - group_id (FK)
   - start_date
   - end_date

6. **shifts** - Store shift definitions
   - shift_id (PK)
   - name
   - start_time
   - end_time
   - required_qualifications (JSON)
   - min_doctors

7. **schedules** - Store shift assignments
   - schedule_id (PK)
   - shift_id (FK)
   - user_id (FK)
   - date
   - status (planned, completed, missed)
   - notes

8. **preferences** - Store doctor shift preferences
   - preference_id (PK)
   - user_id (FK)
   - day_of_week
   - shift_id (FK)
   - preference_level (1-5)
   - valid_from
   - valid_to

9. **availability** - Store doctor availability
   - availability_id (PK)
   - user_id (FK)
   - start_datetime
   - end_datetime
   - availability_type (available, unavailable)
   - reason

10. **authentication** - Store authentication information
    - auth_id (PK)
    - user_id (FK)
    - password_hash
    - role (doctor, admin)
    - last_login
    - reset_token
    - token_expiry
