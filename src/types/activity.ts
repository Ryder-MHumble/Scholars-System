export interface ActivitySpeaker {
  name: string;
  title: string;
  institution: string;
  isAcademician?: boolean;
}

export interface Activity {
  id: string;
  title: string;
  type: "学术讲座" | "研讨会" | "论坛" | "院士报告";
  date: string;
  location: string;
  organizer: string;
  speakers: ActivitySpeaker[];
  description?: string;
  registrationUrl?: string;
}
