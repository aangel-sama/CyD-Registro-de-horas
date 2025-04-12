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
import { db } from "@/firebase/config";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/icons";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Firestore converter
const timeEntryConverter = {
  toFirestore: (item: any) => ({
    date: item.date,
    project: item.project,
    document: item.document,
    hours: item.hours,
    description: item.description,
  }),
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    };
  },
};

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

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [totalHours, setTotalHours] = useState(0);
  const [activeSummary, setActiveSummary] = useState<"daily" | "weekly" | "monthly">("daily");
  const [dailySummaryData, setDailySummaryData] = useState<{ [key: string]: number }>({});
  const [weeklySummaryData, setWeeklySummaryData] = useState<{ [key: string]: number }>({});
  const [monthlySummaryData, setMonthlySummaryData] = useState<{ [key: string]: number }>({});

  const handleSubmit = async () => {
    if (!date || !project || !hours || isNaN(hours) || !document) {
      toast({
        title: "Error",
        description: "Please fill in all fields correctly.",
        variant: "destructive",
      });
      return;
    }

    const newEntry = {
      date: format(date, "yyyy-MM-dd"),
      project,
      document,
      hours,
      description,
    };

    try {
      await addDoc(collection(db, "timeEntries").withConverter(timeEntryConverter), newEntry);
      fetchTimeEntries();
      toast({
        title: "Success",
        description: "Time entry added successfully.",
      });
    } catch (e) {
      console.error("Add Entry Error:", e);
      toast({
        title: "Error",
        description: "Could not save time entry.",
        variant: "destructive",
      });
    }
  };

  const fetchTimeEntries = async () => {
    const querySnapshot = await getDocs(collection(db, "timeEntries"));
    const fetchedEntries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any;

    setTimeEntries(fetchedEntries);
  };

  useEffect(() => {
    fetchTimeEntries();
  }, []);

  useEffect(() => {
    let dailySummary: { [key: string]: number } = {};
    let weeklySummary: { [key: string]: number } = {};
    let monthlySummary: { [key: string]: number } = {};

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const currentMonth = todayStr.slice(0, 7);

    timeEntries.forEach((entry) => {
      const key = `${entry.project}-${entry.document}`;

      // Daily Summary
      if (entry.date === todayStr) {
        dailySummary[key] = (dailySummary[key] || 0) + entry.hours;
      }

      // Weekly Summary
      if (new Date(entry.date) >= startOfWeek(new Date())) {
        weeklySummary[key] = (weeklySummary[key] || 0) + entry.hours;
      }

      // Monthly Summary
      if (entry.date.startsWith(currentMonth)) {
        monthlySummary[key] = (monthlySummary[key] || 0) + entry.hours;
      }
    });

    setDailySummaryData(dailySummary);
    setWeeklySummaryData(weeklySummary);
    setMonthlySummaryData(monthlySummary);
  }, [timeEntries]);

  const startOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
    return new Date(d.setDate(diff));
  };

  const getTotalHours = (summaryData: { [key: string]: number }) => {
    return Object.values(summaryData).reduce((sum, hrs) => sum + hrs, 0);
  };

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
                <select
                  id="project"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="input"
                >
                  {projects.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="document">Document/Plan</Label>
                <select
                  id="document"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  className="input"
                >
                  {documents.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
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
                value={description}
                placeholder="Enter task description"
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

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Time Summary</CardTitle>
          <CardDescription>Summary of hours worked per project today.</CardDescription>
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
              {Object.entries(dailySummaryData).map(([key, hrs]) => {
                const [proj, doc] = key.split("-");
                const descs = timeEntries
                  .filter(e => e.project === proj && e.document === doc && e.date === format(new Date(), "yyyy-MM-dd"))
                  .map(e => e.description)
                  .join(", ");
                return (
                  <TableRow key={key}>
                    <TableCell>{proj}</TableCell>
                    <TableCell>{doc}</TableCell>
                    <TableCell>{hrs}</TableCell>
                    <TableCell>{descs}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell>{getTotalHours(dailySummaryData)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Time Summary</CardTitle>
          <CardDescription>Summary of hours worked per project this week.</CardDescription>
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
              {Object.entries(weeklySummaryData).map(([key, hrs]) => {
                const [proj, doc] = key.split("-");
                const descs = timeEntries
                  .filter(e => e.project === proj && e.document === doc && new Date(e.date) >= startOfWeek(new Date()))
                  .map(e => e.description)
                  .join(", ");
                return (
                  <TableRow key={key}>
                    <TableCell>{proj}</TableCell>
                    <TableCell>{doc}</TableCell>
                    <TableCell>{hrs}</TableCell>
                    <TableCell>{descs}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell>{getTotalHours(weeklySummaryData)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Time Summary</CardTitle>
          <CardDescription>Summary of hours worked per project this month.</CardDescription>
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
              {Object.entries(monthlySummaryData).map(([key, hrs]) => {
                const [proj, doc] = key.split("-");
                const descs = timeEntries
                  .filter(e => e.project === proj && e.document === doc && e.date.startsWith(format(new Date(), "yyyy-MM")))
                  .map(e => e.description)
                  .join(", ");
                return (
                  <TableRow key={key}>
                    <TableCell>{proj}</TableCell>
                    <TableCell>{doc}</TableCell>
                    <TableCell>{hrs}</TableCell>
                    <TableCell>{descs}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell>{getTotalHours(monthlySummaryData)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
