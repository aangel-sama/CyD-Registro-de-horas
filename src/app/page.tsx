"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfWeek, getWeek } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type SummaryType = "daily" | "weekly" | "monthly";

export default function Home() {
  const [projects] = useState(["Project A", "Project B", "Project C"]);
  const [documents] = useState(["Document 1", "Document 2", "Document 3"]);

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [project, setProject] = useState(projects[0]);
  const [document, setDocument] = useState(documents[0]);
  const [hours, setHours] = useState<number | undefined>(8);
  const [description, setDescription] = useState<string>("");

  const [timeEntries, setTimeEntries] = useState<
    { date: string; project: string; document: string; hours: number; description?: string; id: string }[]
  >([]);

  const { toast } = useToast();

  const fetchTimeEntries = async () => {
    setTimeEntries([]);
  };

  useEffect(() => {
    fetchTimeEntries();
  }, []);

  const dailySummaryData = useMemo(() => {
    let dailySummary: { [key: string]: number } = {};
    const todayStr = format(new Date(), "yyyy-MM-dd");
    timeEntries.forEach((entry) => {
      const key = `${entry.project}-${entry.document}`;
      if (entry.date === todayStr) {
        dailySummary[key] = (dailySummary[key] || 0) + entry.hours;
      }
    });
    return dailySummary;
  }, [timeEntries]);

  const weeklySummaryData = useMemo(() => {
    let weeklySummary: { [key: string]: number } = {};
    timeEntries.forEach((entry) => {
      const key = `${entry.project}-${entry.document}-${format(new Date(entry.date), "EEE")}`;
      if (new Date(entry.date) >= startOfWeek(new Date())) {
        weeklySummary[key] = (weeklySummary[key] || 0) + entry.hours;
      }
    });
    return weeklySummary;
  }, [timeEntries]);

  const monthlySummaryData = useMemo(() => {
    let monthlySummary: { [key: string]: number } = {};
    const todayStr = format(new Date(), "yyyy-MM");
    timeEntries.forEach((entry) => {
      const weekNumber = getWeek(new Date(entry.date));
      const key = `${entry.project}-${entry.document}-Semana ${weekNumber}`;
      if (entry.date.startsWith(todayStr)) {
        monthlySummary[key] = (monthlySummary[key] || 0) + entry.hours;
      }
    });
    return monthlySummary;
  }, [timeEntries]);

  const getDescriptions = useCallback(
    (project: string, document: string, filterFn: (entry: any) => boolean) => {
      return timeEntries
        .filter(entry => entry.project === project && entry.document === document && filterFn(entry))
        .map(entry => entry.description)
        .join(", ");
    },
    [timeEntries]
  );

  const getTotalHours = useCallback(
    (summaryData: { [key: string]: number }) =>
      Object.values(summaryData).reduce((sum, hrs) => sum + hrs, 0),
    []
  );

  const handleSubmit = useCallback(() => {
    if (!date || !project || !document || !hours) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields.",
      });
      return;
    }

    const newTimeEntry = {
      id: Date.now().toString(),
      date: format(date, "yyyy-MM-dd"),
      project,
      document,
      hours,
      description,
    };

    setTimeEntries(prev => [...prev, newTimeEntry]);
    setDate(new Date());
    setHours(8);
    setDescription("");

    toast({
      title: "Success",
      description: "Time entry added successfully.",
    });
  }, [date, project, document, hours, description, toast, setTimeEntries]);

  const SummaryCard = useCallback(
    ({
      type,
      title,
      description,
      summaryData,
      dateFilter,
    }: {
      type: SummaryType;
      title: string;
      description: string;
      summaryData: { [key: string]: number };
      dateFilter: (entry: any) => boolean;
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
                  <TableHead>Document/Plan</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(summaryData).map(([key, hrs]) => {
                  let proj, doc, dayOrWeek;
                  if (type === "weekly") {
                    [proj, doc, dayOrWeek] = key.split("-");
                  } else if (type === "monthly") {
                    [proj, doc, dayOrWeek] = key.split("-");
                  } else {
                    [proj, doc] = key.split("-");
                    dayOrWeek = "";
                  }
                  return (
                    <TableRow key={key}>
                      <TableCell>{proj}</TableCell>
                      <TableCell>{doc}</TableCell>
                      <TableCell>{hrs}</TableCell>
                      <TableCell>
                        {dayOrWeek ? `${dayOrWeek}: ` : ""}
                        {getDescriptions(proj, doc, dateFilter)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell>{getTotalHours(summaryData)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    },
    [getDescriptions, getTotalHours]
  );

  const DailySummaryCard = useCallback(() => {
    const dateFilter = (entry: any) => entry.date === format(new Date(), "yyyy-MM-dd");
    return (
      <SummaryCard
        type="daily"
        title="Daily Time Summary"
        description="Summary of hours worked per project today."
        summaryData={dailySummaryData}
        dateFilter={dateFilter}
      />
    );
  }, [dailySummaryData, SummaryCard]);

  const WeeklySummaryCard = useCallback(() => {
    const dateFilter = (entry: any) => new Date(entry.date) >= startOfWeek(new Date());
    return (
      <SummaryCard
        type="weekly"
        title="Weekly Time Summary"
        description="Summary of hours worked per project this week."
        summaryData={weeklySummaryData}
        dateFilter={dateFilter}
        type="weekly"
      />
    );
  }, [weeklySummaryData, SummaryCard]);

  const MonthlySummaryCard = useCallback(() => {
    const dateFilter = (entry: any) => entry.date.startsWith(format(new Date(), "yyyy-MM"));
    return (
      <SummaryCard
        type="monthly"
        title="Monthly Time Summary"
        description="Summary of hours worked per project this month."
        summaryData={monthlySummaryData}
        dateFilter={dateFilter}
        type="monthly"
      />
    );
  }, [monthlySummaryData, SummaryCard]);

  return (
    <div className="container mx-auto py-10 px-4">
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
                <Calendar id="date" mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
              </div>
              <div>
                <Label htmlFor="project">Project</Label>
                <Select onValueChange={setProject} defaultValue={project} className="w-full">
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent className="w-full">
                    {projects.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="document">Document/Plan</Label>
                <Select onValueChange={setDocument} defaultValue={document} className="w-full">
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select document" /></SelectTrigger>
                  <SelectContent className="w-full">
                    {documents.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hours">Hours Worked</Label>
                <Input type="number" id="hours" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-4 mt-4">
              <Button onClick={handleSubmit}>Add Time Entry</Button>
            </div>
          </>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <DailySummaryCard />
      <Separator className="my-6" />
      <WeeklySummaryCard />
      <Separator className="my-6" />
      <MonthlySummaryCard />
    </div>
  );
}


