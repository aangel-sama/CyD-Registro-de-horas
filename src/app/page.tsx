"use client";

import { useState, useEffect } from "react";
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { auth, db } from "@/firebase/config";
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { format } from 'date-fns';

const timeEntryConverter = {
  toFirestore: (item: any) => {
    return {
      date: item.date,
      project: item.project,
      document: item.document,
      hours: item.hours,
      description: item.description,
      userId: item.userId
    };
  },
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      date: data.date,
      project: data.project,
      document: data.document,
      hours: data.hours,
      description: data.description,
      userId: data.userId
    };
  }
}

export default function Home() {
  const [user, loading, error] = useAuthState(auth);
  const [projects, setProjects] = useState(["Project A", "Project B", "Project C"]);
  const [documents, setDocuments] = useState(["Document 1", "Document 2", "Document 3"]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [project, setProject] = useState(projects[0]);
  const [document, setDocument] = useState(documents[0]);
  const [hours, setHours] = useState<number | undefined>(8);
  const [description, setDescription] = useState<string | undefined>("");
  const [timeEntries, setTimeEntries] = useState<
    { date: string; project: string; document: string; hours: number; description?: string, userId: string, id: string }[]
  >([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timeSummary, setTimeSummary] = useState<{ [project: string]: { [document: string]: number } }>({});
  const [totalHours, setTotalHours] = useState(0);

  // New state variables for summaries
  const [activeSummary, setActiveSummary] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [summaryData, setSummaryData] = useState<{ [key: string]: number }>({});

  const handleSubmit = async () => {
    if (!date || !project || !hours || !document) {
      setErrorMsg("Please fill in all fields.");
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      setErrorMsg("Please sign in to add time entries.");
      toast({
        title: "Error",
        description: "Please sign in to add time entries.",
        variant: "destructive",
      });
      return;
    }

    const newEntry = {
      date: format(date, 'yyyy-MM-dd'),
      project,
      document,
      hours,
      description,
      userId: user.uid
    };

    try {
      const docRef = await addDoc(collection(db, "timeEntries").withConverter(timeEntryConverter), newEntry);
      console.log("Document written with ID: ", docRef.id);
      fetchTimeEntries(); // Refresh time entries after submission
      setErrorMsg(null);
      toast({
        title: "Success",
        description: "Time entry added successfully.",
      });
    } catch (e) {
      console.error("Error adding document: ", e);
      setErrorMsg("Failed to add time entry.");
      toast({
        title: "Error",
        description: "Failed to add time entry.",
        variant: "destructive",
      });
    }
  };

  const fetchTimeEntries = async () => {
    if (user) {
      const q = query(collection(db, "timeEntries"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const fetchedEntries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTimeEntries(fetchedEntries as any);
    }
  };

  useEffect(() => {
    fetchTimeEntries();
  }, [user]);

  useEffect(() => {
    let newTimeSummary: { [key: string]: number } = {};

    if (activeSummary === 'daily') {
      const today = new Date().toISOString().slice(0, 10);
      newTimeSummary = timeEntries
        .filter(entry => entry.date === today)
        .reduce((acc, entry) => {
          const key = `${entry.project}-${entry.document}`;
          acc[key] = (acc[key] || 0) + entry.hours;
          return acc;
        }, {});
    } else if (activeSummary === 'weekly') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startDate = startOfWeek.toISOString().slice(0, 10);

      newTimeSummary = timeEntries
        .filter(entry => entry.date >= startDate)
        .reduce((acc, entry) => {
          const key = `${entry.project}-${entry.document}`;
          acc[key] = (acc[key] || 0) + entry.hours;
          return acc;
        }, {});
    } else if (activeSummary === 'monthly') {
      const currentMonth = new Date().toISOString().slice(0, 7);
      newTimeSummary = timeEntries
        .filter(entry => entry.date.startsWith(currentMonth))
        .reduce((acc, entry) => {
          const key = `${entry.project}-${entry.document}`;
          acc[key] = (acc[key] || 0) + entry.hours;
          return acc;
        }, {});
    }

    setSummaryData(newTimeSummary);
    setTotalHours(Object.values(newTimeSummary).reduce((acc, hours) => acc + hours, 0));
  }, [timeEntries, activeSummary]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setErrorMsg("Failed to sign in with Google.");
      toast({
        title: "Error",
        description: "Failed to sign in with Google.",
        variant: "destructive",
      });
    }
  };

  const signOutWithGoogle = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out with Google: ", error);
      setErrorMsg("Failed to sign out.");
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
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
          {loading ? (
            <p>Loading...</p>
          ) : user ? (
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              <Button variant="destructive" onClick={signOutWithGoogle}>Sign Out</Button>
            </>
          ) : (
            <Button onClick={signInWithGoogle}>Sign In with Google</Button>
          )}
          {errorMsg && <p className="text-red-500 mt-2">{errorMsg}</p>}
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle>Time Summary</CardTitle>
          <CardDescription>Summary of hours worked per project.</CardDescription>
        </CardHeader>
        <CardContent>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                View Summary <Icons.chevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setActiveSummary('daily')}>Daily</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveSummary('weekly')}>Weekly</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveSummary('monthly')}>Monthly</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Document/Plan</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(summaryData).map(([key, hours]) => {
                const [project, doc] = key.split('-');
                const descriptions = timeEntries
                  .filter(entry => entry.project === project && entry.document === doc)
                  .map(entry => entry.description)
                  .join(", ");
                return (
                  <TableRow key={key}>
                    <TableCell>{project}</TableCell>
                    <TableCell>{doc}</TableCell>
                    <TableCell>{hours}</TableCell>
                    <TableCell>{descriptions}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell>{totalHours}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
