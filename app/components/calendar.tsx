import { StepBackIcon, StepForwardIcon } from "lucide-react";

function getShortendText(text: string, length: number = 3) {
  return text.slice(0, length);
}


function startDayFrom(currentDate: number) {}

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

  const today = new Date();
  const currentDate = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDay();

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
          {Array.from({ length: dateRange[currentMonth] }).map((_, index) => {
            return (
              <li
                key={index}
                className={`text-center py-2 ${
                  index + 1 === currentDate
                    ? "text-primary bg-secondary font-medium underline"
                    : "text-muted-foreground"
                } ${index + 1 < currentDate ? "line-through" : ""}`}
              >
                <button className="w-full h-full">{index + 1}</button>
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
          {day}
        </li>
      ))}
    </ul>
  );
};
