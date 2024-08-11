import { useState } from "react";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
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

const DAYS_PER_WEEK = 7;

const DATE_RANGES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function getShortendText(text: string, length: number = 3) {
  return text.slice(0, length);
}

function getDatesInView(
  currentDate: number,
  numberOfDaysInCurrentMonth: number,
  currentDay: number,
  numberOfDaysInPrevMonth: number,
  numberOfDaysInNextMonth: number
) {
  const extraSlotsForPrevMonth = currentDate % currentDay;
  const extraSlotsForNextMonth =
    (extraSlotsForPrevMonth + numberOfDaysInCurrentMonth) % DAYS_PER_WEEK;
  const prevMonthDates = getPrevMonthDates(
    extraSlotsForPrevMonth,
    numberOfDaysInPrevMonth
  );
  const nextMonthDates = getNextMonthDates(
    extraSlotsForNextMonth,
    numberOfDaysInNextMonth
  );

  const dates = Array.from({ length: numberOfDaysInCurrentMonth }).map(
    (_, i) => i + 1
  );
  console.log(
    extraSlotsForPrevMonth,
    extraSlotsForNextMonth,
    numberOfDaysInCurrentMonth
  );
  return { prevMonthDates, currentMonthDates: dates, nextMonthDates };
}

function getPrevMonthDates(
  extraSlots: number,
  numberOfDaysInPrevMonth: number
) {
  return Array.from({ length: numberOfDaysInPrevMonth })
    .map((_, i) => i + 1)
    .splice(numberOfDaysInPrevMonth - extraSlots, numberOfDaysInPrevMonth);
}

function getNextMonthDates(
  extraSlotsForNextMonth: number,
  numberOfDaysInNextMonth: number
) {
  return Array.from({ length: numberOfDaysInNextMonth })
    .map((_, i) => i + 1)
    .splice(0, extraSlotsForNextMonth);
}

export default function Calendar() {
  const [date, setDate] = useState(() => new Date());

  const today = new Date(); // August 9th, 2024 (Friday)
  const currentDate = date.getDate(); // returns the date 9
  const currentMonth = date.getMonth(); // 7
  const currentYear = date.getFullYear(); // 2024
  const currentDay = date.getDay(); // 5 -> starts from sunday

  const { prevMonthDates, currentMonthDates, nextMonthDates } = getDatesInView(
    currentDate,
    DATE_RANGES[currentMonth],
    currentDay,
    DATE_RANGES[currentMonth - 1],
    DATE_RANGES[currentMonth + 1]
  );

  return (
    <div className="max-w-3xl border rounded-lg p-2">
      <div className="flex items-center justify-between gap-10">
        <button>{currentYear - 1}</button>
        <div className="flex items-center justify-center gap-4">
          <button
            className="text-muted-foreground text-xs"
            onClick={() =>
              setDate(new Date(new Date().setMonth(currentMonth - 1)))
            }
          >
            {getShortendText(MONTHS[currentMonth - 1])}
          </button>
          <span className="text-primary">{MONTHS[currentMonth]}</span>
          <button
            className="text-muted-foreground text-xs"
            onClick={() =>
              setDate(new Date(new Date().setMonth(currentMonth + 1)))
            }
          >
            {getShortendText(MONTHS[currentMonth + 1])}
          </button>
        </div>
        <button>{currentYear + 1}</button>
      </div>
      <div className="text-sm mt-4">
        <Weeks days={DAYS} currentDay={currentDay} />

        <ul className="grid grid-cols-7">
          {prevMonthDates.map((date, index) => {
            return (
              <li
                key={index}
                className="text-center py-2 text-muted-foreground"
              >
                <PrevDate date={date} />
              </li>
            );
          })}
          {currentMonthDates.map((date, index) => {
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
                  <PrevDate date={date} />
                ) : (
                  <button className="w-full h-full">{date}</button>
                )}
              </li>
            );
          })}
          {nextMonthDates.map((date, index) => {
            return (
              <li
                key={index}
                className={`text-center py-2 ${
                  date === currentDate
                    ? "text-primary bg-secondary font-medium underline"
                    : "text-muted-foreground"
                }`}
              >
                <button className="w-full h-full">{date}</button>
              </li>
            );
          })}
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

const PrevDate = ({ date }: { date: number }) => {
  return (
    <span
      title="Past days are not allowed"
      className="cursor-not-allowed line-through text-destructive"
    >
      {date}
    </span>
  );
};
