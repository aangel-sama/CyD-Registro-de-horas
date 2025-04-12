"use client";

import { useState, useEffect } from "react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  format,
  startOfWeek,
  getWeek,
  isSameDay,
  isSameWeek,
  isSameMonth,
  parseISO
} from "date-fns";
import { useToast } from "@/hooks/use-toast";

type Entry = {
  id: string;
  date: string;
  project: string;
  document: string;
  hours: number;
  description?: string;
};

type SummaryType = "daily" | "weekly" | "monthly";

export default function Home() {
  const { toast } = useToast();

  const [projects] = useState(["Project A", "Project B", "Project C"]);
  const [documents] = useState(["Document 1", "Document 2", "Document 3"]);

  const [date, setDate] = useState<Date>(new Date());
  const [project, setProject] = useState(projects[0]);
  const [document, setDocument] = useState(documents[0]);
  const [hours, setHours] = useState<number>(8);
  const [description, setDescription] = useState("");

  const [timeEntries, setTimeEntries] = useState<Entry[]>([]);

  useEffect(() => {
    setTimeEntries([]); // Aquí podrías cargar desde Firebase u otra fuente
  }, []);

  const handleSubmit = () => {
    if (!date || !project || !document || !hours) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields.",
      });
      return;
    }

    const newEntry: Entry = {
      id: Date.now().toString(),
      date: format(date, "yyyy-MM-dd"),
      project,
      document,
      hours,
      description,
    };

    setTimeEntries(prev => [...prev, newEntry]);
    setDate(new Date());
    setHours(8);
    setDescription("");

    toast({
      title: "Success",
      description: "Time entry added successfully.",
    });
  };

  const getGroupedSummaryData = (type: SummaryType) => {
    const now = new Date();
    const summary: { [key: string]: { hours: number; descriptions: string[] } } = {};

    timeEntries.forEach(entry => {
      const entryDate = parseISO(entry.date);

      const include =
        (type === "weekly" && isSameWeek(entryDate, now)) ||
        (type === "monthly" && isSameMonth(entryDate, now));

      if (!include) return;

      let key = `${entry.project}-${entry.document}`;
      if (type === "weekly") key += `-${format(entryDate, "EEE")}`;
      if (type === "monthly") key += `-Semana ${getWeek(entryDate)}`;

      if (!summary[key]) {
        summary[key] = { hours: 0, descriptions: [] };
      }

      summary[key].hours += entry.hours;
      if (entry.description) summary[key].descriptions.push(entry.description);
    });

    return summary;
  };

  const SummaryCard = ({
    type,
    title,
    description,
  }: {
    type: SummaryType;
    title: string;
    description: string;
  }) => {
    const now = new Date();

    const isRelevant = (entryDate: Date) => {
      if (type === "daily") return isSameDay(entryDate, now);
      if (type === "weekly") return isSameWeek(entryDate, now);
      if (type === "monthly") return isSameMonth(entryDate, now);
      return false;
    };

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
                <TableHead>Document</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {type === "daily" ? (
                // Mostrar cada entrada individual (no agrupada)
                timeEntries
                  .filter(entry => isRelevant(parseISO(entry.date)))
                  .map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.project}</TableCell>
                      <TableCell>{entry.document}</TableCell>
                      <TableCell>{entry.hours}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                    </TableRow>
                  ))
              ) : (
                // Agrupar en semanal y mensual
                Object.entries(getGroupedSummaryData(type)).map(([key, data]) => {
                  const [proj, doc, label] = key.split("-");
                  return (
                    <TableRow key={key}>
                      <TableCell>{proj}</TableCell>
                      <TableCell>{doc}</TableCell>
                      <TableCell>{data.hours}</TableCell>
                      <TableCell>
                        {label ? `${label}: ` : ""}
                        {data.descriptions.join(", ")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              <TableRow>
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell>
                  {type === "daily"
                    ? timeEntries
                        .filter(entry => isRelevant(parseISO(entry.date)))
                        .reduce((sum, e) => sum + e.hours, 0)
                    : Object.values(getGroupedSummaryData(type)).reduce((sum, d) => sum + d.hours, 0)}
                </TableCell>
                <TableCell />
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
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="document">Document/Plan</Label>
              <Select onValueChange={setDocument} defaultValue={document}>
                <SelectTrigger><SelectValue placeholder="Select document" /></SelectTrigger>
                <SelectContent>
                  {documents.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="hours">Hours Worked</Label>
              <Input
                type="number"
                id="hours"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
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

          <Button onClick={handleSubmit}>Add Time Entry</Button>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <SummaryCard
        type="daily"
        title="Daily Time Summary"
        description="Summary of individual tasks logged today."
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
