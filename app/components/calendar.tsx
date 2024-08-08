import { useState } from "react";

function getShortendText(text: string, length: number = 3) {
  return text.slice(0, length);
}

function getDatesInView(
  currentDate: number,
  numberOfDays: number,
  currentDay: number,
  numberOfDaysInPrevMonth: number,
  numberOfDaysInNextMonth: number,
) {
  const extraSlotsForPrevMonth = currentDate % currentDay
  // const extraSlotsForNextMonth = 
  const lastMonthDates = getPrevMonthDates(extraSlotsForPrevMonth, numberOfDaysInPrevMonth)
  // const nextMonthDates = getNextMonthDates(extraSlots, numberOfDaysInNextMonth)
  const dates = [...lastMonthDates];
  for (let i = 1; i <= numberOfDays; i++) {
    dates.push(i);
  }
  return dates;
}

function getPrevMonthDates(extraSlots: number, numberOfDaysInPrevMonth: number) {
  return Array.from({length: numberOfDaysInPrevMonth}).map((_, i) => i + 1).splice(numberOfDaysInPrevMonth - extraSlots, numberOfDaysInPrevMonth)
}

export default function Calendar() {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dateRange = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const [date, setDate] = useState(() => new Date())

  const today = new Date(); // August 9th, 2024 (Friday)
  const currentDate = today.getDate(); // returns the date 9
  const currentMonth = today.getMonth(); // 7
  const currentYear = today.getFullYear(); // 2024
  const currentDay = today.getDay(); // 5 -> starts from sunday

  const datesInView = getDatesInView(currentDate, dateRange[currentMonth], currentDay, dateRange[currentMonth -1], dateRange[currentMonth + 1])

  return (
    <div className="max-w-3xl border rounded-lg p-2">
      <div className="flex items-center justify-between gap-10">
        <button>{currentYear - 1}</button>
        <div className="flex items-center justify-center gap-4">
          <button className="text-muted-foreground text-xs">
            {getShortendText(months[currentMonth - 1])}
          </button>
          <span className="text-primary">{months[currentMonth]}</span>
          <button className="text-muted-foreground text-xs">
            {getShortendText(months[currentMonth + 1])}
          </button>
        </div>
        <button>{currentYear + 1}</button>
      </div>
      <div className="text-sm mt-4">
        <Weeks days={days} currentDay={currentDay} />

        <ul className="grid grid-cols-7">
          {datesInView.map(
            (date, index) => {
              return (
                <li
                  key={index}
                  className={`text-center py-2 ${
                    date === currentDate
                      ? "text-primary bg-secondary font-medium underline"
                      : "text-muted-foreground"
                  }`}
                >
                  {date < currentDate ? (
                    <span
                      title="Past days are not allowed"
                      className="cursor-not-allowed line-through"
                    >
                      {date}
                    </span>
                  ) : (
                    <button className="w-full h-full">{date}</button>
                  )}
                </li>
              );
            }
          )}
        </ul>
      </div>
    </div>
  );
}

type WeeksProps = {
  days: Array<string>;
  currentDay: number;
};

const Weeks = ({ days, currentDay }: WeeksProps) => {
  return (
    <ul className="grid grid-cols-7 font-medium">
      {days.map((day) => (
        <li
          key={day}
          className={`text-center ${
            day === days[currentDay]
              ? "text-primary font-medium"
              : "text-muted-foreground"
          }`}
        >
          {getShortendText(day)}
        </li>
      ))}
    </ul>
  );
};
