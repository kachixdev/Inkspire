import { useEffect, useState } from "react";
import { formatDate, formatRelativeTime } from "../../utils/api";

function RelativeTime({ value }) {
  const [timeAgo, setTimeAgo] = useState(() => formatRelativeTime(value));

  useEffect(() => {
    function updateTime() {
      setTimeAgo(formatRelativeTime(value));
    }

    updateTime();
    const timerId = window.setInterval(updateTime, 30_000);
    return () => window.clearInterval(timerId);
  }, [value]);

  const date = new Date(value);
  const fullDate = Number.isNaN(date.getTime()) ? formatDate(value) : date.toLocaleString();

  return (
    <time dateTime={Number.isNaN(date.getTime()) ? undefined : date.toISOString()} title={fullDate}>
      {timeAgo}
    </time>
  );
}

export default RelativeTime;
