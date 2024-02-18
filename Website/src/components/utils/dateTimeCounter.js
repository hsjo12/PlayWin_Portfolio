import React, { useState, useEffect } from "react";

const DateTimeCounter = ({ startDate, className }) => {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      const endDateObject = new Date(startDate);
      const currentDate = new Date();
      const differenceInTime = endDateObject.getTime() - currentDate.getTime();

      // Calculate days, hours, minutes, and seconds
      const days = Math.floor(differenceInTime / (1000 * 3600 * 24));
      const hours = Math.floor(
        (differenceInTime % (1000 * 3600 * 24)) / (1000 * 3600)
      );
      const minutes = Math.floor(
        (differenceInTime % (1000 * 3600)) / (1000 * 60)
      );
      const seconds = Math.floor((differenceInTime % (1000 * 60)) / 1000);

      // Update state
      setTimeRemaining({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startDate]);

  const formatTime = (time) => {
    if (time < 10) {
      if (time < 0) {
        return `00`;
      }
      return `0${time}`;
    }
    return time;
  };

  const formatResult = (timeRemaining) => {
    const dates = formatTime(timeRemaining.days);
    const hours = formatTime(timeRemaining.hours);
    const minutes = formatTime(timeRemaining.minutes);
    const seconds = formatTime(timeRemaining.seconds);

    if (
      Number(dates) === 0 &&
      Number(hours) === 0 &&
      Number(minutes) === 0 &&
      Number(seconds) === 0
    ) {
      return "Time Ended";
    }

    return `${dates}d: ${hours}h: ${minutes}m: ${seconds}s`;
  };

  return (
    <div className={className}>
      <p>{formatResult(timeRemaining)}</p>
    </div>
  );
};

export default DateTimeCounter;
