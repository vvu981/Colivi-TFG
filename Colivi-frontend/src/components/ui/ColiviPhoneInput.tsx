import PhoneInput, { type Value as PhoneValue } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { PhoneCountrySelect } from "./PhoneCountrySelect";

interface ColiviPhoneInputProps {
  id?: string;
  value: PhoneValue | undefined;
  onChange: (value: PhoneValue | undefined) => void;
  placeholder?: string;
  className?: string;
}

export const ColiviPhoneInput = ({
  id,
  value,
  onChange,
  placeholder = "+34 600 000 000",
  className = "phone-input-colivi",
}: ColiviPhoneInputProps) => {
  return (
    <PhoneInput
      id={id}
      international
      defaultCountry="ES"
      value={value}
      onChange={onChange}
      countrySelectComponent={PhoneCountrySelect}
      className={className}
      placeholder={placeholder}
    />
  );
};
