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
  getWeek,
  isSameDay,
  isSameWeek,
  isSameMonth,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type Entry = {
  id: string;
  date: string;
  project: string;
  hours: number;
};

type SummaryType = "daily" | "weekly" | "monthly";

export default function Home() {
  const { toast } = useToast();

  const [projects] = useState(["Project A", "Project B", "Project C"]);
  const [date, setDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<
    { project: string; hours: number }[]
  >([{ project: projects[0], hours: 0 }]); // Start with one entry
  const [timeEntries, setTimeEntries] = useState<Entry[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [showAlert, setShowAlert] = useState(false); // State to control the alert
  const [alertMessage, setAlertMessage] = useState(""); // State to control the alert
  const [isSubmitted, setIsSubmitted] = useState(false); // Track if the form is submitted

  useEffect(() => {
    // Recalculate total hours whenever entries change
    const newTotalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
    setTotalHours(newTotalHours);
  }, [entries]);

  const addEntry = () => {
    //Add time entry
    setEntries((prev) => [...prev, { project: projects[0], hours: 0 }]);
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

    setTimeEntries(newTimeEntries);
    setIsSubmitted(true); // Set submitted status to true
    setEntries([{ project: projects[0], hours: 0 }]); // Reset entries to initial state
    setDate(new Date()); // Reset date to current date
    toast({
      title: "Success",
      description: "Time entry added successfully.",
    });
  };

  const handleEdit = () => {
    setIsSubmitted(false);
  };

  const dailySummaryData = useMemo(() => {
    let dailySummary: { [key: string]: number } = {};
    const todayStr = format(new Date(), "yyyy-MM-dd");
    timeEntries.forEach((entry) => {
      if (entry.date === todayStr) {
        const key = `${entry.project}`;
        dailySummary[key] = (dailySummary[key] || 0) + entry.hours;
      }
    });
    return dailySummary;
  }, [timeEntries]);

  const weeklySummaryData = useMemo(() => {
    const weeklySummary: { [key: string]: { [day: string]: number } } = {};
    const start = startOfWeek(new Date());
    const end = new Date();

    timeEntries.forEach((entry) => {
      const entryDate = parseISO(entry.date);
      if (isWithinInterval(entryDate, { start, end })) {
        const day = format(entryDate, "EEE");
        const key = `${entry.project}`;

        if (!weeklySummary[key]) {
          weeklySummary[key] = {};
        }

        weeklySummary[key][day] = (weeklySummary[key][day] || 0) + entry.hours;
      }
    });
    return weeklySummary;
  }, [timeEntries]);

  const monthlySummaryData = useMemo(() => {
    const monthlySummary: { [key: string]: { [week: string]: number } } = {};
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    timeEntries.forEach((entry) => {
      const entryDate = parseISO(entry.date);
      if (
        isWithinInterval(entryDate, { start: startOfMonth, end: endOfMonth })
      ) {
        const weekNumber = getWeek(entryDate, { weekStartsOn: 1 });
        const key = `${entry.project}`;

        if (!monthlySummary[key]) {
          monthlySummary[key] = {};
        }

        monthlySummary[key][`Week ${weekNumber}`] =
          (monthlySummary[key][`Week ${weekNumber}`] || 0) + entry.hours;
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
                <TableHead>Project</TableHead>
                {type === "weekly" && <TableHead>Day</TableHead>}
                {type === "monthly" && <TableHead>Week</TableHead>}
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
                Object.entries(weeklySummaryData).map(([project, days]) => (
                  Object.entries(days).map(([day, hours]) => (
                    <TableRow key={`${project}-${day}`}>
                      <TableCell>{project}</TableCell>
                      <TableCell>{day}</TableCell>
                      <TableCell>{hours}</TableCell>
                    </TableRow>
                  ))
                ))}
              {type === "monthly" &&
                Object.entries(monthlySummaryData).map(([project, weeks]) => (
                  Object.entries(weeks).map(([week, hours]) => (
                    <TableRow key={`${project}-${week}`}>
                      <TableCell>{project}</TableCell>
                      <TableCell>{week}</TableCell>
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

  return (
    <div className="container mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Daily Time Entry</CardTitle>
          <CardDescription>Record your time spent on each project.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {!isSubmitted ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Calendar
                    id="date"
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                  />
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
                      pattern="^[0-9]+(\.[0-9]{1,2})?$"
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
                  <AlertDescription>
                    {alertMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4 mt-4">
                {totalHours < 8 && (
                  <Button type="button" onClick={addEntry}>
                    Add Project
                  </Button>
                )}
                <Button onClick={handleSubmit}>Add Time Entry</Button>
              </div>
            </>
          ) : (
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
