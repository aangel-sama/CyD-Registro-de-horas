"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  format,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  isSameDay,
  parseISO,
  getWeek,
  isWeekend,
  getDay,
} from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type Entry = {
  id: string;
  project: string;
  hours: number;
  date: string;
};

type SummaryType = "daily" | "weekly" | "monthly";

export default function Home() {
  const { toast } = useToast();

  const [projects] = useState(["Project A", "Project B", "Project C"]);
  const [date, setDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<
    { project: string; hours: number }[]
  >([]);
  const [timeEntries, setTimeEntries] = useState<Entry[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [showAlert, setShowAlert] = useState(false); // State to control the alert
  const [alertMessage, setAlertMessage] = useState(""); // State to control the alert
  const [editMode, setEditMode] = useState(false); // Track if the form is in edit mode
  const [isSubmitted, setIsSubmitted] = useState(false); // Track if the form is submitted
  const [showCalendar, setShowCalendar] = useState(true);

  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // set the start of week to monday
  const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 });

  const isValidDate = (date: Date) => {
    return isWithinInterval(date, {
      start: startOfCurrentWeek,
      end: today,
    });
  };

  useEffect(() => {
    // Load time entries from local storage on component mount
    const storedTimeEntries = localStorage.getItem('timeEntries');
    if (storedTimeEntries) {
      setTimeEntries(JSON.parse(storedTimeEntries));
    }
  }, []);

  useEffect(() => {
    // Recalculate total hours whenever entries change
    const newTotalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
    setTotalHours(newTotalHours);
  }, [entries]);

  useEffect(() => {
    // Save time entries to local storage whenever timeEntries changes
    localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
  }, [timeEntries]);

  useEffect(() => {
    // Clear entries when the date changes
    setEntries([]);
    setTotalHours(0);
    setIsSubmitted(false);
    setEditMode(false);
    setShowCalendar(true);

    const dateStr = format(date, "yyyy-MM-dd");
    const existingEntries = timeEntries.filter(entry => entry.date === dateStr);
    if (existingEntries.length > 0) {
      // Load existing entries into the entries state for editing
      setEntries(existingEntries.map(entry => ({ project: entry.project, hours: entry.hours })));
      setEditMode(true);
    }
  }, [date, timeEntries]);

  const addEntry = () => {
    if (totalHours >= 8) {
      setShowAlert(true);
      setAlertMessage("You have already added 8 hours.");
      return;
    }
    setEntries((prev) => {
      // If the last entry has hours less than 8, create a new entry with remaining hours
      const lastEntry = prev[prev.length - 1];
        // Add a new entry with 0 hours initially
        return [...prev, { project: projects[0], hours: 0 }];
    });
  };


  const updateEntry = (index: number, field: string, value: any) => {
    setEntries((prev) => {
      const newEntries = [...prev];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return newEntries;
    });
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (totalHours !== 8) {
      setShowAlert(true); // Show the alert message
      setAlertMessage("Total hours must be exactly 8 hours.");
      return;
    }

    setShowAlert(false); // Ensure alert is hidden if conditions are met

    const newTimeEntries = entries.map((entry) => ({
      id: Date.now().toString(),
      date: format(date, "yyyy-MM-dd"),
      project: entry.project,
      hours: entry.hours,
    }));

    // If in edit mode, replace the entries for the selected date
    if (editMode) {
      const dateStr = format(date, "yyyy-MM-dd");
      setTimeEntries((prev) =>
        prev.filter((entry) => entry.date !== dateStr).concat(newTimeEntries)
      );
    } else {
      setTimeEntries([...timeEntries, ...newTimeEntries]);
    }

    localStorage.setItem('timeEntries', JSON.stringify([...timeEntries, ...newTimeEntries]));

    setIsSubmitted(true); // Set submitted status to true
    setEntries([]); // Reset entries to initial state
    setEditMode(false); // Reset edit mode
    setTotalHours(0)
    setShowCalendar(false);

    toast({
      title: "Success",
      description: "Time entry added successfully.",
    });
  };


  const handleEdit = () => {
    setEditMode(true);
    setIsSubmitted(false);
    setShowCalendar(true);
    const dateStr = format(date, "yyyy-MM-dd");
    const existingEntries = timeEntries.filter(entry => entry.date === dateStr);
    if (existingEntries.length > 0) {
      // Load existing entries into the entries state for editing
      setEntries(existingEntries.map(entry => ({ project: entry.project, hours: entry.hours })));
    } else {
      // If no entries exist for the date, initialize with empty entries
      setEntries([{ project: projects[0], hours: 0 }]);
    }
  };

  const dailySummaryData = useMemo(() => {
    let dailySummary: { [key: string]: number } = {};
    const todayStr = format(date, "yyyy-MM-dd");
    timeEntries.forEach((entry) => {
        const key = `${entry.project}`;
      if (entry.date === todayStr) {
        dailySummary[key] = (dailySummary[key] || 0) + entry.hours;
      }
    });
    return dailySummary;
  }, [timeEntries, date]);

  const weeklySummaryData = useMemo(() => {
    const weeklySummary: { [day: string]: { [project: string]: number } } = {};
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    daysOfWeek.forEach(day => {
      weeklySummary[day] = {};
    });

    timeEntries.forEach((entry) => {
      const entryDate = parseISO(entry.date);
      if (isWithinInterval(entryDate, { start, end })) {
        const day = format(entryDate, "EEE", { weekStartsOn: 1 });
        const project = entry.project;

        if (daysOfWeek.includes(day)) {
          weeklySummary[day][project] = (weeklySummary[day][project] || 0) + entry.hours;
        }
      }
    });
    return weeklySummary;
  }, [timeEntries, date]);


 const monthlySummaryData = useMemo(() => {
    const monthlySummary: { [week: string]: { [project: string]: number } } = {};
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    timeEntries.forEach((entry) => {
      const entryDate = parseISO(entry.date);
      if (
        isWithinInterval(entryDate, { start: startOfMonth, end: endOfMonth })
      ) {
        const weekNumber = getWeek(entryDate, { weekStartsOn: 1 });
        const week = `Week ${weekNumber}`;
        const project = entry.project;

        if (!monthlySummary[week]) {
          monthlySummary[week] = {};
        }

        monthlySummary[week][project] =
          (monthlySummary[week][project] || 0) + entry.hours;
      }
    });
    return monthlySummary;
  }, [timeEntries]);

  const SummaryCard = ({
    type,
    title,
    description,
  }: {
    type: SummaryType;
    title: string;
    description: string;
  }) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {type === "weekly" && <TableHead>Day</TableHead>}
                {type === "monthly" && <TableHead>Week</TableHead>}
                <TableHead>Project</TableHead>
                <TableHead>Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {type === "daily" &&
                Object.entries(dailySummaryData).map(([project, hours]) => (
                  <TableRow key={project}>
                    <TableCell>{project}</TableCell>
                    <TableCell>{hours}</TableCell>
                  </TableRow>
                ))}
              {type === "weekly" &&
                Object.entries(weeklySummaryData).map(([day, projects]) => (
                    Object.entries(projects).map(([project, hours]) => (
                      hours > 0 && (
                    <TableRow key={`${day}-${project}`}>
                      <TableCell>{day}</TableCell>
                      <TableCell>{project}</TableCell>
                      <TableCell>{hours}</TableCell>
                    </TableRow>
                      )
                  ))
                ))}
              {type === "monthly" &&
                Object.entries(monthlySummaryData).map(([week, projects]) => (
                  Object.entries(projects).map(([project, hours]) => (
                    <TableRow key={`${week}-${project}`}>
                      <TableCell>{week}</TableCell>
                      <TableCell>{project}</TableCell>
                      <TableCell>{hours}</TableCell>
                    </TableRow>
                  ))
                ))}
              <TableRow>
                <TableCell colSpan={type === "daily" ? 1 : 2}>Total</TableCell>
                <TableCell>
                  {type === "daily"
                    ? Object.values(dailySummaryData).reduce(
                        (sum, hours) => sum + hours,
                        0
                      )
                    : type === "weekly"
                    ? Object.values(weeklySummaryData).reduce(
                        (sum, days) =>
                          sum +
                          Object.values(days).reduce(
                            (daySum, dayHours) => daySum + dayHours,
                            0
                          ),
                        0
                      )
                    : Object.values(monthlySummaryData).reduce(
                        (sum, weeks) =>
                          sum +
                          Object.values(weeks).reduce(
                            (weekSum, weekHours) => weekSum + weekHours,
                            0
                          ),
                        0
                      )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const isWeekCompleted = () => {
    const currentDate = new Date(date);
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // week starts on monday
    let dateToCheck = new Date(start);
  
    while (dateToCheck <= currentDate) {
       if (isWeekend(dateToCheck)) {
        dateToCheck.setDate(dateToCheck.getDate() + 1);
        continue; // Skip weekends
      }
      const dateStr = format(dateToCheck, "yyyy-MM-dd");
      const hasEntries = timeEntries.some(entry => entry.date === dateStr);
      if (!hasEntries) {
        return false;
      }
      dateToCheck.setDate(dateToCheck.getDate() + 1);
    }
    return true;
  };
  

  return (
    <div className="container mx-auto py-10 px-4">
       {!isWeekCompleted() && (
        <Alert variant="warning">
          <AlertTitle>Incomplete Time Entries</AlertTitle>
          <AlertDescription>Please fill out time entries for all previous days this week.</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Daily Time Entry</CardTitle>
          <CardDescription>Record your time spent on each project.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                    {showCalendar &&(
                        <Calendar
                            id="date"
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                            disabledDays={[
                                ...(!isValidDate(date) ? [{
                                    before: startOfCurrentWeek,
                                    after: today,
                                }] : []),
                                { daysOfWeek: [0, 6] },
                            ]}
                        />
                    )}
                  {!isValidDate(date) && (
                    <Alert variant="destructive">
                      <AlertTitle>Invalid Date</AlertTitle>
                      <AlertDescription>
                        You can only select dates from the current week up to
                        today.
                      </AlertDescription>
                    </Alert>
                  )}
                   {isWeekend(date) && (
                      <Alert variant="destructive">
                        <AlertTitle>Weekend Date</AlertTitle>
                        <AlertDescription>
                          You cannot select weekends.
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              </div>
              {entries.map((entry, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center"
                >
                  <div>
                    <Label htmlFor={`project-${index}`}>Project</Label>
                    <Select
                      id={`project-${index}`}
                      onValueChange={(value) =>
                        updateEntry(index, "project", value)
                      }
                      defaultValue={entry.project}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`hours-${index}`}>Hours Worked</Label>
                    <Input
                      type="number"
                      id={`hours-${index}`}
                      placeholder="Enter hours"
                      value={entry.hours.toString()}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (!isNaN(value) && value >= 0) {
                          updateEntry(index, "hours", value);
                        }
                      }}
                      pattern="^[0-9]+(\\.[0-9]{1,2})?$"
                    />
                  </div>
                  {entries.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeEntry(index)}
                    >
                      X
                    </Button>
                  )}
                </div>
              ))}
              {showAlert && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{alertMessage}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-4 mt-4">
                {totalHours < 8 && (
                  <Button type="button" onClick={addEntry}>
                    Add Project
                  </Button>
                )}
                <Button onClick={handleSubmit} disabled={!isValidDate(date) || isWeekend(date)}>
                  Add Time Entry
                </Button>
              </div>
            </>
          

         {isWeekCompleted() && !showCalendar && (
            <>
              <Alert>
                <AlertTitle>Time entry submitted</AlertTitle>
                <AlertDescription>
                  You have submitted your time entry for today.
                </AlertDescription>
              </Alert>
              <Button onClick={handleEdit}>Edit Time Entry</Button>
            </>
         )}
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <SummaryCard
        type="daily"
        title="Daily Time Summary"
        description="Summary of hours worked today."
      />
      <Separator className="my-6" />
      <SummaryCard
        type="weekly"
        title="Weekly Time Summary"
        description="Grouped summary of hours worked this week."
      />
      <Separator className="my-6" />
      <SummaryCard
        type="monthly"
        title="Monthly Time Summary"
        description="Grouped summary of hours worked this month."
      />
    </div>
  );
}

