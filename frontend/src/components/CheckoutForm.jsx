import { SHIPPING_FIELDS } from "../utils/validation";

function CheckoutForm({ form, errors, onChange, disabled }) {
  return (
    <section className="checkout-form">
      <h2>Shipping Details</h2>

      {SHIPPING_FIELDS.map(({ name, label, placeholder, inputMode }) => (
        <label key={name}>
          {label}
          <input
            name={name}
            value={form[name]}
            onChange={onChange}
            placeholder={placeholder}
            inputMode={inputMode}
            disabled={disabled}
            aria-invalid={Boolean(errors[name])}
          />
          {errors[name] && <span className="field-error">{errors[name]}</span>}
        </label>
      ))}
    </section>
  );
}

export default CheckoutForm;
