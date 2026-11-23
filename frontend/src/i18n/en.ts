/* English: the source of every translation key. Other languages fall back to these strings. */
export const en = {
  // common
  next: 'Next', back: 'Back', continue: 'Continue', skip: 'Skip', save: 'Save', cancel: 'Cancel',
  submit: 'Submit', loading: 'Loading…', retry: 'Try again', done: 'Done', edit: 'Edit', add: 'Add',
  call: 'Call', logout: 'Log out', required: 'Required', saved: 'Saved', something_wrong: 'Something went wrong',

  // login
  tagline: 'Drive | Manage | Grow',
  login_title: 'Welcome back', login_sub: 'Log in with your mobile number',
  mobile_number: 'Mobile number', send_otp: 'Get OTP', enter_otp: 'Enter OTP',
  otp_sent_to: 'We sent a 4-digit code to', otp_test_hint: 'Test mode: the OTP is 1234',
  verify: 'Verify', change_number: 'Change', resend_otp: 'Resend OTP', resend_in: 'Resend in {s}s',
  no_account: 'New to RajWorthman?', sign_up: 'Sign up', have_account: 'Already have an account?', log_in: 'Log in',
  invalid_phone: 'Enter a valid 10-digit mobile number', wrong_otp: 'Incorrect OTP',
  not_registered: 'This number is not registered yet. Please sign up.', welcome_back_toast: 'Welcome back!',

  // sign-up: role
  role_title: 'How do you want to join?', role_sub: 'Choose one to continue',
  role_driver: 'Sign up as Driver', role_driver_sub: 'Find driving work near you',
  role_fleet: 'Sign up as Fleet Owner', role_fleet_sub: 'List vehicles and hire drivers',

  // sign-up: language
  language_title: 'Choose your language', language_sub: 'The app will show in this language. You can change it later.',

  // sign-up: permissions
  perm_title: 'Allow permissions', perm_sub: 'RajWorthman needs these to work properly on your phone',
  perm_location: 'Location', perm_location_sub: 'Show you to fleet owners nearby',
  perm_camera: 'Camera', perm_camera_sub: 'Take photos of your documents',
  perm_files: 'Files', perm_files_sub: 'Upload PDFs of your documents',
  perm_gallery: 'Gallery', perm_gallery_sub: 'Pick document photos you already have',
  perm_phone: 'Phone', perm_phone_sub: 'Call fleet owners and drivers',
  perm_sms: 'Messages', perm_sms_sub: 'Read the OTP automatically',
  allow_all: 'Allow all', allowed: 'Allowed', not_now: 'Not now',

  // sign-up: phone / name / type
  phone_title: 'Enter your mobile number', phone_sub: 'We will send you a one-time password (OTP)',
  name_title: 'Tell us about yourself', name_sub: 'Enter your name as on your Aadhaar card',
  first_name: 'First name', last_name: 'Last name', dob: 'Date of birth', dob_hint: 'You must be at least 18 years old',
  type_title: 'How will you work?', driver_only: 'Driver', driver_only_sub: 'I drive vehicles owned by others',
  driver_vehicle: 'Driver with vehicle', driver_vehicle_sub: 'I have my own vehicle',
  fleet_title: 'Select the vehicles you can drive', fleet_sub: 'Choose all that apply',
  create_account: 'Create account', step_of: 'Step {n} of {t}',

  // vehicle types
  v_CAR: 'Car', v_VAN: 'Van', v_BUS: 'Bus', v_MINI_TRUCK: 'Mini truck', v_LORRY: 'Lorry', v_TRUCK: 'Truck',
  v_TRAILER: 'Trailer', v_TANKER: 'Tanker', v_CRANE: 'Crane', v_TRACTOR: 'Tractor', v_AUTO: 'Auto', v_AMBULANCE: 'Ambulance',

  // driver home
  hello: 'Hello', registration_id: 'ID',
  status_PROFILE_INCOMPLETE: 'Profile incomplete', status_SUBMITTED: 'Waiting for verification',
  status_UNDER_REVIEW: 'Under review', status_APPROVED: 'Verified', status_REJECTED: 'Rejected',
  status_RESUBMISSION_REQUIRED: 'Action needed',
  online: 'Online', offline: 'Offline', online_sub: 'Fleet owners nearby can find you', offline_sub: 'You are hidden from fleet owners',
  finish_profile: 'Finish your profile', steps_done: '{n} of {t} done',
  task_address: 'Home address', task_licence: 'Driving licence details', task_experience: 'Driving experience',
  task_emergency: 'Emergency contact', task_documents: 'Upload documents', task_vehicle: 'Your vehicle details',
  optional: 'Optional',
  send_for_verification: 'Send for verification',
  sent_title: 'Sent for verification', sent_sub: 'Our team is checking your documents. We will notify you here.',
  approved_title: 'You are verified', approved_sub: 'Stay online so fleet owners near you can find you.',
  fix_title: 'Some documents need attention', fix_sub: 'Upload the marked documents again, then send for verification.',
  rejected_sub: 'Your registration was not approved. Contact support for help.',
  location_off: 'Turn on location so fleet owners can find you', turn_on: 'Turn on',

  // navigation
  nav_home: 'Home', nav_documents: 'Documents', nav_alerts: 'Alerts', nav_profile: 'Profile',
  nav_fleet: 'Fleet', nav_find_drivers: 'Drivers',

  // documents
  doc_PROFILE_PHOTO: 'Your photo', doc_AADHAAR_CARD: 'Aadhaar card', doc_DRIVING_LICENCE_FRONT: 'Licence (front)',
  doc_DRIVING_LICENCE_BACK: 'Licence (back)', doc_RC_BOOK: 'RC book', doc_ADDRESS_PROOF: 'Address proof', doc_PAN_CARD: 'PAN card',
  documents_title: 'My documents', documents_sub: 'Clear photos get verified faster',
  upload: 'Upload', reupload: 'Upload again', take_photo: 'Take photo', choose_file: 'Choose from gallery or files',
  uploading: 'Uploading…', not_uploaded: 'Not uploaded',
  doc_status_PENDING: 'Waiting', doc_status_UNDER_REVIEW: 'Checking', doc_status_VERIFIED: 'Accepted',
  doc_status_RESUBMISSION_REQUIRED: 'Upload again', doc_status_REJECTED: 'Rejected', doc_status_EXPIRED: 'Expired',

  // forms
  door_no: 'House / door no.', street: 'Street / area', city_village: 'City / village', district: 'District',
  state: 'State', pincode: 'PIN code',
  licence_no: 'Licence number', licence_class: 'Licence class', issuing_authority: 'Issuing RTO',
  issue_date: 'Issue date', expiry_date: 'Expiry date', state_of_issue: 'State of issue',
  years_experience: 'Years of driving experience', preferred_location: 'Preferred work location',
  long_distance: 'I can do long-distance trips', previous_company: 'Previous employer (optional)',
  contact_name: 'Contact name', contact_number: 'Contact number', relationship: 'Relationship',
  make: 'Make (manufacturer)', model: 'Model', reg_no: 'Registration number', year: 'Year',
  seats: 'Seats', fuel: 'Fuel', colour: 'Colour', has_ac: 'Has AC', capacity: 'Capacity (e.g. 10 tonnes)',
  vehicle_type: 'Vehicle type',

  // fleet owner
  fleet_hello_sub: 'Manage your fleet and hire drivers', my_fleet: 'My fleet', vehicles_count: '{n} vehicles',
  add_vehicle: 'Add vehicle', vehicle_photos: 'Vehicle photos', add_photo: 'Add photo', rc_photo: 'RC book photo (optional)',
  no_vehicles: 'No vehicles yet', no_vehicles_sub: 'Add your first vehicle with photos',
  fleet_send: 'Send fleet for verification', company_name: 'Company name (optional)', city: 'City',
  find_drivers: 'Find drivers nearby', find_drivers_sub: 'See available drivers on the map',
  drivers_near_you: 'Drivers near you', km_away: '{d} km away', no_drivers: 'No drivers found in this area',
  verified_driver: 'Verified', pending_verification: 'Not verified yet', years_exp: '{n} yrs exp',
  all_vehicles: 'All', search_radius: 'Within {d} km', locating: 'Finding your location…', available_now: 'Available now',
  remove: 'Remove',

  // profile / alerts
  fleet_owner_label: 'Fleet owner',
  my_profile: 'My profile', language: 'Language', notifications: 'Notifications', no_notifications: 'No notifications yet',
  help: 'Help & support', app_version: 'Version', delete_confirm: 'Are you sure?',
};

export type TranslationKey = keyof typeof en;
