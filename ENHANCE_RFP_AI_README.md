# RFP Enhance with AI Feature

## Overview

The "Enhance with AI" feature allows users to automatically improve their RFP (Request for Proposal) responses using AI-powered content enhancement. This feature analyzes the existing RFP content and provides professional, comprehensive improvements.

## Features

- **Content Enhancement**: Automatically improves existing RFP sections with more professional and compelling content
- **Context Separation**: Separates company and proposal context for better organization
- **New Section Generation**: Creates additional sections like Deliverables and Service Costs if they don't exist
- **Auto-Save**: Automatically saves enhanced content to the database
- **Real-time Feedback**: Provides toast notifications for success/error states

## Backend Implementation

### API Endpoint

**URL**: `POST /enhance-rfp-with-ai`

**Request Body**:
```json
{
  "company_context": {
    "company_logo": "string",
    "company_website": "string",
    "company_ceo": "string",
    "company_name": "string",
    "company_street": "string",
    "company_city": "string",
    "company_state": "string",
    "company_zip": "string",
    "company_phone": "string",
    "company_email": "string",
    "company_esign": "string"
  },
  "proposal_context": {
    "proposal_class": "string",
    "proposal_bid": "string",
    "proposal_org": "string",
    "proposal_address": "string",
    "proposal_phone": "string",
    "proposal_due_date": "string",
    "proposal_description": "string",
    "proposal_title": "string"
  },
  "pursuitId": "string",
  "userId": "string"
}
```

**Response**:
```json
{
  "success": true,
  "enhanced_data": {
    "company_logo": "string",
    "company_website": "string",
    "proposal_class": "string",
    "proposal_bid": "string",
    "date_today": "string",
    "company_ceo": "string",
    "company_street": "string",
    "company_city": "string",
    "company_state": "string",
    "company_zip": "string",
    "company_phone": "string",
    "company_email": "string",
    "proposal_org": "string",
    "proposal_address": "string",
    "date_returned": "string",
    "company_name": "string",
    "company_esign": "string",
    "cert_elig": "string",
    "gen_para1": "string",
    "auth_reps": [],
    "gen_para2": "string",
    "proposal_class_image": "string",
    "gen_para3": "string",
    "gen_para4": "string",
    "gen_para5": "string",
    "gen_para6": "string",
    "customers": [],
    "gen_para7": "string",
    "gen_para8": "string",
    "gen_para9": "string",
    "proposal_due_date": "string",
    "scope_of_work": "string",
    "proposal_infrastructure": "string",
    "assessments": [],
    "deliverables": [],
    "service_costs": [],
    "project_cost": "string",
    "terms_cond": [],
    "pay_schedule": [],
    "summary_intro": "string",
    "summary": [],
    "summary_conclusion": "string"
  },
  "message": "RFP content enhanced successfully"
}
```

### Data Structure Mapping

The backend maps the input data to the comprehensive JSON structure:

**Company Context Mapping**:
- `company_logo` → `company_logo`
- `company_website` → `company_website`
- `company_ceo` → `company_ceo`
- `company_name` → `company_name`
- `company_street` → `company_street`
- `company_city` → `company_city`
- `company_state` → `company_state`
- `company_zip` → `company_zip`
- `company_phone` → `company_phone`
- `company_email` → `company_email`
- `company_esign` → `company_esign`

**Proposal Context Mapping**:
- `proposal_class` → `proposal_class`
- `proposal_bid` → `proposal_bid`
- `proposal_org` → `proposal_org`
- `proposal_address` → `proposal_address`
- `proposal_due_date` → `proposal_due_date`
- `proposal_description` → `scope_of_work`

## Frontend Implementation

### Component Location

The feature is implemented in `frontend/src/components/rfp/rfpResponse.tsx`

### Key Functions

1. **`enhanceWithAI()`**: Main function that handles the AI enhancement process
2. **Company Data Fetching**: Fetches company data from user_companies table with fallback logic
3. **Address Parsing**: Automatically parses company address from letterhead field when company data is not available
4. **Context Preparation**: Creates separate company and proposal context objects
5. **API Integration**: Uses the correct API base URL for development/production
6. **State Management**: Updates sections and other fields with enhanced content
7. **Error Handling**: Comprehensive error handling with user feedback

### Data Fetching Logic

The frontend implements a three-tier data fetching strategy:

1. **Primary Source**: User's primary company from `user_companies` table
2. **Secondary Source**: Form data (existing RFP content)
3. **Fallback**: Default data

```javascript
// First, try to get company data from user_companies table
const { data: userCompanies, error: userCompaniesError } = await supabase
  .from('user_companies')
  .select(`
    *,
    companies (
      id,
      name,
      website,
      logo,
      address,
      city,
      state,
      zip_code,
      phone,
      email,
      ceo_name
    )
  `)
  .eq('user_id', user.id)
  .eq('is_primary', true)
  .single();
```

### Database Schema

The feature relies on the following Supabase tables:

**user_companies table**:
```sql
create table public.user_companies (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  company_id uuid not null,
  role text null,
  is_primary boolean null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_companies_pkey primary key (id),
  constraint user_companies_user_id_company_id_key unique (user_id, company_id),
  constraint user_companies_company_id_fkey foreign KEY (company_id) references companies (id),
  constraint user_companies_user_id_fkey foreign KEY (user_id) references profiles (id)
);
```

**companies table** (referenced by user_companies):
- `id`: Company identifier
- `name`: Company name
- `website`: Company website
- `logo`: Company logo URL
- `address`: Company street address
- `city`: Company city
- `state`: Company state
- `zip_code`: Company zip code
- `phone`: Company phone number
- `email`: Company email
- `ceo_name`: Company CEO name

### Address Parsing Logic

The frontend automatically parses the company address from the letterhead field when company data is not available:

```javascript
// Parse from letterhead field
const addressParts = letterhead.split(',').map(part => part.trim());
companyStreet = addressParts.length > 0 ? addressParts[0] : letterhead;
companyCity = addressParts.length > 1 ? addressParts[2] : '';
const companyStateZip = addressParts.length > 2 ? addressParts[3] : '';
[companyState, companyZip] = companyStateZip.split(' ').filter(Boolean);
```

### Data Priority Logic

The system uses the following priority order for company data:

1. **Company Data from Database**: If user has a primary company in `user_companies` table
2. **Form Data**: Existing RFP form content
3. **Default Data**: Fallback values

```javascript
const company_context = {
  company_logo: companyData?.logo || logo || "",
  company_website: companyData?.website || companyWebsite,
  company_ceo: companyData?.ceo_name || submittedBy,
  company_name: companyData?.name || companyName,
  company_street: companyStreet,
  company_city: companyCity,
  company_state: companyState || "",
  company_zip: companyZip || "",
  company_phone: companyData?.phone || phone,
  company_email: companyData?.email || "",
  company_esign: "",
};
```

### Usage

1. Navigate to an RFP response in the application
2. Click the "Enhance with AI" button (Sparkles icon)
3. The system will:
   - Parse company address from letterhead
   - Create company and proposal context objects
   - Show a loading notification
   - Send context data to the backend
   - Process the enhanced response
   - Update the UI with improved content
   - Auto-save the changes
   - Show a success notification

## Testing

### Backend Testing

Run the test script to verify the endpoint:

```bash
cd backend
python test_enhance_rfp.py
```

The test script uses the exact data format you specified:

```python
test_data = {
    "company_context": {
        "company_logo": "C:\\Users\\rdine\\Downloads\\bizradar_modules\\Indrasol company logo_.png",
        "company_website": "https://www.indrasol.com",
        "company_ceo": "Brahma Gupta",
        "company_name": "Indrasol",
        "company_street": "6101 Bollinger Canyon Rd, Suite 335 C",
        "company_city": "San Ramon",
        "company_state": "CA",
        "company_zip": "94583",
        "company_phone": "(510) 754-2001",
        "company_email": "bgupta@indrasol.com",
        "company_esign": "image8.gif"
    },
    "proposal_context": {
        "proposal_class": "Cybersecurity Assessment",
        "proposal_bid": "105-25",
        "proposal_org": "KENAI PENINSULA BOROUGH SCHOOL DISTRICT",
        "proposal_address": "Purchasing Department\n139 East Park Avenue\nSoldotna, Alaska 99669-7553",
        "proposal_phone": "(907) 714-8876",
        "proposal_due_date": "4:00 P.M., Alaska Time, February 7, 2025",
        "proposal_description": "All the requirements and job description",
        "proposal_title": "Title of the proposal"
    }
}
```

### Frontend Testing

1. Start the backend server: `cd backend && python -m uvicorn app.main:app --reload --port 5000`
2. Start the frontend: `cd frontend && npm run dev`
3. Navigate to an RFP response
4. Click "Enhance with AI" and verify the enhancement process

## Configuration

### Environment Variables

Ensure the following environment variables are set:

- `OPENAI_API_KEY`: Required for AI content enhancement
- `VITE_API_BASE_URL`: Frontend API base URL for production

### API Base URL Logic

The frontend automatically determines the correct API base URL:
- Development: `http://localhost:5000`
- Production: Uses `VITE_API_BASE_URL` environment variable

## Error Handling

### Backend Errors

- **400 Bad Request**: Missing company_context or proposal_context
- **500 Internal Server Error**: AI processing errors or JSON parsing failures

### Frontend Errors

- **Network Errors**: Connection issues with the backend
- **API Errors**: Non-200 response status codes
- **Processing Errors**: Issues with enhanced data parsing

All errors are logged to the console and displayed to users via toast notifications.

## Future Enhancements

Potential improvements for the feature:

1. **Batch Processing**: Enhance multiple sections simultaneously
2. **Custom Prompts**: Allow users to specify enhancement preferences
3. **Version History**: Track enhancement history and allow rollbacks
4. **Template Selection**: Choose from different enhancement styles
5. **Real-time Preview**: Show enhancement suggestions before applying
6. **Address Validation**: Improve address parsing accuracy
7. **Email Extraction**: Automatically extract email from submittedBy field

## Dependencies

### Backend Dependencies

- FastAPI
- OpenAI Python SDK
- Python JSON handling

### Frontend Dependencies

- React
- Sonner (for toast notifications)
- Fetch API for HTTP requests

## Security Considerations

- API key is stored securely in environment variables
- User authentication is required for enhancement requests
- Input validation prevents malicious content injection
- Rate limiting should be implemented for production use 