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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type Entry = {
  id: string;
  date: string;
  project: string;
  hours: number;
  document?: string;
};

type SummaryType = "daily" | "weekly" | "monthly";

export default function Home() {
  const { toast } = useToast();

  const [projects] = useState(["Project A", "Project B", "Project C"]);
  const [date, setDate] = useState<Date>(new Date());
  const [project, setProject] = useState(projects[0]);
  const [hours, setHours] = useState<number | undefined>(null);
  const [timeEntries, setTimeEntries] = useState<Entry[]>([]);
  const [document, setDocument] = useState<string | undefined>(undefined);

  const handleSubmit = () => {
    if (!date || !project || hours === undefined || hours === null) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields.",
      });
      return;
    }

    const todayStr = format(date, "yyyy-MM-dd");
    const dailyHours = timeEntries.filter(
      (entry) => entry.date === todayStr
    ).reduce((sum, entry) => sum + entry.hours, 0);

    if (dailyHours + hours > 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "You can only add up to 8 hours per day. You have already added " +
          dailyHours +
          " hours today.",
      });
      return;
    }

    const newEntry: Entry = {
      id: Date.now().toString(),
      date: format(date, "yyyy-MM-dd"),
      project,
      hours,
      document,
    };

    setTimeEntries((prev) => [...prev, newEntry]);
    setDate(new Date());
    setHours(null);
    setDocument(undefined);

    toast({
      title: "Success",
      description: "Time entry added successfully.",
    });
  };

  const dailySummaryData = useMemo(() => {
    const dailySummary: { [key: string]: number } = {};
    const todayStr = format(new Date(), "yyyy-MM-dd");
    timeEntries.forEach((entry) => {
      if (entry.date === todayStr) {
        const key = `${entry.project} - ${entry.document || "N/A"}`;
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
        const key = `${entry.project} - ${entry.document || "N/A"}`;

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
        const key = `${entry.project} - ${entry.document || "N/A"}`;

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
                        (sum, days) => sum + Object.values(days).reduce((daySum, dayHours) => daySum + dayHours, 0),
                        0
                      )
                    : Object.values(monthlySummaryData).reduce(
                        (sum, weeks) => sum + Object.values(weeks).reduce((weekSum, weekHours) => weekSum + weekHours, 0),
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
            <div>
              <Label htmlFor="project">Project</Label>
              <Select onValueChange={setProject} defaultValue={project}>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hours">Hours Worked</Label>
              <Input
                type="number"
                id="hours"
                placeholder="Enter hours"
                value={hours !== null && hours !== undefined ? hours.toString() : ""}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setHours(isNaN(value) ? null : value);
                }}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <Button onClick={handleSubmit}>Add Time Entry</Button>
          </div>
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
