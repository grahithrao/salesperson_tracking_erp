# FieldTrack ERP — Physical Device Testing & Field Verification Checklist

This document provides a field verification checklist for deploying and validating the React Native mobile application on physical Android and iOS hardware.

---

## 1. Automated vs. Physical Device Verification Summary

| Capability | Automated Test Status | Physical Device Test Requirement |
|---|---|---|
| **Authentication & Token Storage** | ✅ Fully Verified in integration test | Verify biometric login & token persistence across OS reboot |
| **Salesperson Dashboard Metrics** | ✅ Fully Verified against PostgreSQL | Check visual rendering on small Android/iOS screen notches |
| **Attendance Start/End Calculations** | ✅ Fully Verified with distance math | Verify GPS coordinate capture with physical device hardware |
| **Client Registry & Scoping** | ✅ Fully Verified in API & DB | Test phone dialer (`tel:`) and Google Maps intent integration |
| **Visit Radius Check** | ✅ Fully Verified with Haversine formula | Physically walk inside & outside 100m geofence radius |
| **Order Arithmetic (GST & Discount)** | ✅ Fully Verified ($10\times 450 + 5\times 250 + 2\times 650$) | Test keyboard input and decimal quantity entries |
| **Payment Voucher & PDF Receipt** | ✅ Fully Verified with PDFKit stream | Test sharing receipt via native WhatsApp / Share Sheet |
| **Offline Outbox & Idempotency** | ✅ Fully Verified in batch sync test | Physically enable Airplane Mode, capture transactions, toggle network |
| **Background GPS Breadcrumb Tracking** | ⚠️ Architecture & Task Defined | **Requires physical hardware validation (see Section 2 below)** |

---

## 2. Physical Device Field Test Checklist

### 2.1 Location Permissions & Onboarding
- [ ] **Android 11+ Two-Step Permission Flow**:
  - Verify app first requests "While using the app" (Foreground).
  - Verify app displays explanation dialog before requesting "Allow all the time" (Background).
  - Confirm app behavior if user selects "Only this time" or denies background permission.
- [ ] **iOS Permission Prompt**:
  - Verify `NSLocationWhenInUseUsageDescription` displays customized business rationale.
  - Verify iOS system prompt for "Change to Always Allow" appears after the first background session.

### 2.2 Work Session Tracking (Start Day ➔ End Day)
- [ ] **Start Day**:
  - Tap "Start Day" with GPS enabled. Verify green "ON DUTY" status badge activates.
  - Verify persistent notification appears in Android Notification Shade: *"FieldTrack is actively recording route"*.
  - Turn off GPS in device settings. Verify operational warning badge: *"GPS Disabled"* without crashing.
- [ ] **Active Tracking Under Movement**:
  - Travel $> 500$ meters by foot or vehicle.
  - Check Admin Web Dashboard `/salespersons/live` to confirm coordinates update within 60–120 seconds.
- [ ] **Stationary Battery Optimization**:
  - Keep device motionless on a desk for $> 10$ minutes.
  - Confirm GPS capture frequency drops to conserve battery (speed $< 1.0$ m/s).
- [ ] **Screen Lock & Background Execution**:
  - Lock device screen for 15 minutes while walking.
  - Unlock device; confirm route polyline on Admin map reflects unbroken breadcrumb points.
- [ ] **End Day**:
  - Tap "End Day". Confirm background tracking notification dismisses immediately.
  - Verify Section 34 Daily Summary modal displays accurate duration, distance, orders, and sales.
  - Confirm zero GPS updates sent to server after End Day.

### 2.3 OS Battery Optimization & Force-Stop Behavior
- [ ] **Android Battery Saver**:
  - Enable "Battery Saver" mode on Samsung / Xiaomi / Pixel devices.
  - Verify whether OEM aggressive task killer terminates background service.
  - If killed, add app to "Unrestricted Battery" whitelist in Android App Settings.
- [ ] **App Force-Stop**:
  - Force-close app from Recent Apps switcher.
  - Note: Operating systems prevent background location restarts after explicit user force-stop until the app is reopened. Confirm that when reopened, active duty state restores smoothly.

### 2.4 Offline Operation & Network Recovery
- [ ] **Airplane Mode Capture**:
  - Enable Airplane Mode on device.
  - Start a Visit with an assigned client.
  - Create an Order with 3 items.
  - Collect a Payment of ₹5,000 via Cash.
  - Verify all 3 transactions appear in Outbox queue on Profile screen with `PENDING` status.
- [ ] **Network Reconnection**:
  - Disable Airplane Mode.
  - Observe automatic sync trigger or tap "Sync Now" on Profile screen.
  - Confirm all items transition from `PENDING` ➔ `SYNCING` ➔ `SYNCED`.
  - Confirm on Admin Web Dashboard that the order, payment, and visit appear with exact offline timestamps.
- [ ] **Deduplication Check**:
  - Rapidly double-tap the "Submit Order" button while offline.
  - Confirm local database records only one order with unique idempotency key.

### 2.5 Hardware & Camera Capabilities
- [ ] Camera capture for payment proof screenshot / check voucher.
- [ ] Signature pad capture for visit completion verification.
- [ ] Phone call initiation to client phone number via native dialer.
