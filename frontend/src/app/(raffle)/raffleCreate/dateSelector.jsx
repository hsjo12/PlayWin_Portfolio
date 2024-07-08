import { useCallback, useState } from "react";
import DateTimePicker from "react-datetime-picker";
import "../../../css/dateTimePicker/calendar.css";
import "../../../css/dateTimePicker/clock.css";
import "../../../css/dateTimePicker/dateTimePicker.css";
import { toastMessage } from "@/utils/toastMessage";
export default function DateSelector({ inputValue, setInputValue }) {
  const [value, setValue] = useState(new Date());

  const onChangeValue = useCallback(
    (value) => {
      const oneHour = 3600000;
      const oneHourLater = new Date().getTime() + oneHour;
      if (oneHourLater > value.getTime()) {
        setValue(new Date(oneHourLater));

        /// Blockchain supports seconds, not milliseconds
        const blockchainTime = Math.floor(oneHourLater / 1000);
        setInputValue({ ...inputValue, deadline: blockchainTime });
        return toastMessage(
          `Must be 1 hour later than the current time`,
          "warn"
        );
      } else {
        setValue(value);
        /// Blockchain supports seconds, not milliseconds
        const blockchainTime = Math.floor(value.getTime() / 1000);
        setInputValue({ ...inputValue, deadline: blockchainTime });
      }
    },
    [inputValue]
  );

  return (
    <DateTimePicker
      name="deadline"
      onChange={(value) => onChangeValue(value)}
      value={value}
      wrapperClassName="w-full"
      className="w-full text-white shadow-[5px_5px_10px_#000000]"
    />
  );
}
