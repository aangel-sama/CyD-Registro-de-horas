"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea";

const projects = ["Project A", "Project B", "Project C"]; // Example projects
const documents = ["Document 1", "Document 2", "Document 3"]; // Example documents

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [project, setProject] = useState(projects[0]);
  const [document, setDocument] = useState(documents[0]);
  const [hours, setHours] = useState<number | undefined>(8);
  const [timeEntries, setTimeEntries] = useState<{ date: string; project: string; document: string; hours: number; }[]>([]);

  const handleSubmit = () => {
    if (!date || !project || !hours || !document) {
      alert("Please fill in all fields.");
      return;
    }
    const newEntry = {
      date: date.toISOString().slice(0, 10),
      project: project,
      document: document,
      hours: hours,
    };
    setTimeEntries([...timeEntries, newEntry]);
  };

  const timeSummary = timeEntries.reduce((acc: { [project: string]: { [document: string]: number } }, entry) => {
    if (!acc[entry.project]) {
      acc[entry.project] = {};
    }
    acc[entry.project][entry.document] = (acc[entry.project][entry.document] || 0) + entry.hours;
    return acc;
  }, {});

  const totalHours = timeEntries.reduce((acc, entry) => acc + entry.hours, 0);

  const handleSync = async () => {
    alert("Syncing with Google Drive...");
    // Implement the Google Drive sync logic here
  };

  const handleAnomalyCheck = async () => {
    alert("Checking for anomalies...");
     // Implement the data anomaly detection logic here
  };

  return (
    <div className="container mx-auto py-10">
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
              <select
                id="project"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={project}
                onChange={(e) => setProject(e.target.value)}
              >
                {projects.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="document">Document/Plan</Label>
              <select
                id="document"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
              >
                {documents.map((document) => (
                  <option key={document} value={document}>
                    {document}
                  </option>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
             <Label htmlFor="hours">Description</Label>
              <Textarea placeholder="Type your description here." />
            </div>
          </div>
          <Button onClick={handleSubmit}>Add Time Entry</Button>
        </CardContent>
      </Card>
      <Separator className="my-6" />
      <Card>
        <CardHeader>
          <CardTitle>Time Summary</CardTitle>
          <CardDescription>Summary of hours worked per project.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Document/Plan</TableHead>
                <TableHead>Hours Worked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(timeSummary).map(([project, documents]) => (
                Object.entries(documents).map(([document, hours]) => (
                  <TableRow key={`${project}-${document}`}>
                    <TableCell>{project}</TableCell>
                    <TableCell>{document}</TableCell>
                    <TableCell>{hours}</TableCell>
                  </TableRow>
                ))
              ))}
              <TableRow>
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell>{totalHours}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="flex justify-between mt-4">
              <Button onClick={handleSync} variant="secondary">Sync with Google Drive</Button>
              <Button onClick={handleAnomalyCheck} variant="outline">Check for Anomaly</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
