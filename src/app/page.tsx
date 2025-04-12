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

import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfWeek, startOfMonth } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

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
  const [dailySummaryData, setDailySummaryData] = useState<{ [key: string]: number }>({});
  const [weeklySummaryData, setWeeklySummaryData] = useState<{ [key: string]: number }>({});
  const [monthlySummaryData, setMonthlySummaryData] = useState<{ [key: string]: number }>({});
  const { toast } = useToast();

  const fetchTimeEntries = async () => {
    //  No Firebase needed
    // Replaced with mock data loading
    const mockTimeEntries = [
      { id: "1", date: format(new Date(), "yyyy-MM-dd"), project: "Project A", document: "Document 1", hours: 3, description: "Mock Entry 1" },
      { id: "2", date: format(new Date(), "yyyy-MM-dd"), project: "Project B", document: "Document 2", hours: 5, description: "Mock Entry 2" },
    ];
    setTimeEntries(mockTimeEntries);
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

  const getTotalHours = (summaryData: { [key: string]: number }) => {
    return Object.values(summaryData).reduce((sum, hrs) => sum + hrs, 0);
  };

  const handleSubmit = async () => {
    if (!date || !project || !document || !hours) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    try {
      const newTimeEntry = {
        date: format(date, "yyyy-MM-dd"),
        project,
        document,
        hours,
        description,
        id: String(Date.now()), // Mock ID
      };

      setTimeEntries(prevEntries => [...prevEntries, newTimeEntry]);

      setDate(new Date());
      setHours(8);
      setDescription("");
      setErrorMsg(null);

      toast({
        title: "Success",
        description: "Time entry added successfully.",
      });

      fetchTimeEntries(); // Refresh time entries after adding
    } catch (error: any) {
      console.error("Error adding time entry: ", error);
      setErrorMsg(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add time entry.",
      });
    }
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
                <Select onValueChange={setProject} defaultValue={project} className="w-full">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a project" />
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
                <Label htmlFor="document">Document/Plan</Label>
                <Select onValueChange={setDocument} defaultValue={document} className="w-full">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a document" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
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
