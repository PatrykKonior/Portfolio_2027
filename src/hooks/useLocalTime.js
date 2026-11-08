import { useEffect, useState } from "react";

const format = () =>
    new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Warsaw",
    }).format(new Date());

// Current time in Chorzów, refreshed every 15 seconds.
const useLocalTime = () => {
    const [time, setTime] = useState(format);

    useEffect(() => {
        const id = setInterval(() => setTime(format()), 15000);
        return () => clearInterval(id);
    }, []);

    return time;
};

export default useLocalTime;
