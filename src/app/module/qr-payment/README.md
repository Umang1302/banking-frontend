# QR Payment Module

This module implements QR Code-based payment functionality using pure internal bank transfers (Version 2.0 - No external payment gateways).

## QR Code Format
Internal format: `BOP_PAY|<requestId>|<accountNumber>|<amount>|<description>`

## Components

### 1. QR Generate (`qr-generate/`)
- Generate QR codes for receiving payments
- Features:
  - Account selection
  - Amount input with quick amount buttons
  - Description field
  - QR code expiry selection (1-72 hours)
  - Download QR code as PNG
  - Copy request ID
  - Share QR code image

**Route:** `/dashboard/qr-payment/generate`

### 2. QR Scanner (`qr-scanner/`)
- Upload/scan QR codes to make payments
- Features:
  - Image upload with preview
  - QR code parsing and validation
  - Payment details review
  - Direct internal bank transfer
  - Account selection for payment
  - Balance verification
  - Payment success/failure modal

**Route:** `/dashboard/qr-payment/scan`

### 3. QR History (`qr-history/`)
- View QR payment transactions and requests
- Features:
  - Toggle between transactions and QR requests
  - Filter by status, date, search
  - Expandable transaction details
  - Download QR codes from history
  - Export to CSV

**Route:** `/dashboard/qr-payment/history`

## Services

### QRPaymentService (`services/qr-payment.service.ts`)
Handles all QR payment API calls:
- `generateQRCode()` - POST /api/qr/generate
- `parseQRCode()` - POST /api/qr/parse
- `processPayment()` - POST /api/qr/pay
- `getMyQRRequests()` - GET /api/qr/my-requests
- `getQRTransactionHistory()` - GET /api/qr/transactions/{accountNumber}

## Models

### QR Payment Models (`models/qr-payment.models.ts`)
- `QRGenerateRequest` & `QRGenerateResponse`
- `QRParseRequest` & `QRParseResponse`
- `QRPaymentRequest` & `QRPaymentResponse` (simplified for internal transfers)
- `QRRequest` - Individual QR request
- `QRTransaction` - Transaction history

## Usage

1. **Generate QR Code:**
   - Navigate to QR Payments > Generate QR Code
   - Select account and enter amount
   - Generate and share/download QR code
   - Share request ID or QR image

2. **Pay via QR Code:**
   - Navigate to QR Payments > Pay via QR Code
   - Upload QR code image
   - Review payment details
   - Select payer account
   - Complete internal bank transfer instantly

3. **View History:**
   - Navigate to QR Payments > QR Payment History
   - Toggle between transactions and requests
   - Filter and search transactions

## Integration

- Pure internal bank transfer (no external gateway)
- JWT authentication required for all API calls
- Session management integrated
- Role-based access control (CUSTOMER, ADMIN, ACCOUNTANT roles)
- Real-time balance verification
- Instant transaction settlement

