export const SHIPPING_FIELDS = [
  { name: "fullName", label: "Full Name", placeholder: "Aarav Sharma" },
  { name: "phone", label: "Phone", placeholder: "9876543210", inputMode: "numeric" },
  { name: "addressLine1", label: "Address", placeholder: "22 MG Road" },
  { name: "city", label: "City", placeholder: "Bengaluru" },
  { name: "state", label: "State", placeholder: "Karnataka" },
  { name: "pincode", label: "Pincode", placeholder: "560001", inputMode: "numeric" },
];

// Returns an object of field → message. Empty object means the form is valid.
export const validateShipping = (form) => {
  const errors = {};

  for (const { name, label } of SHIPPING_FIELDS) {
    if (!form[name].trim()) {
      errors[name] = `${label} is required.`;
    }
  }

  if (!errors.phone && !/^[6-9]\d{9}$/.test(form.phone.trim())) {
    errors.phone = "Phone must be a valid 10-digit mobile number.";
  }

  if (!errors.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
    errors.pincode = "Pincode must contain 6 digits.";
  }

  return errors;
};
