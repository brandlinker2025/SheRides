export type Rider = {
  id: string;
  username: string;
  fullName: string;
  bio: string;
  location: string;
  bike: string;
  avatar: string;
  cover: string;
  verified: boolean;
  role: "rider" | "admin";
  followers: number;
  following: number;
  postsCount: number;
  ridesCount: number;
};

export type Story = {
  id: string;
  name: string;
  avatar: string;
  viewed?: boolean;
};

export type FeedPost = {
  id: string;
  author: Rider;
  content: string;
  image?: string;
  location?: string;
  createdAt: string;
  likes: number;
  comments: number;
  liked?: boolean;
  saved?: boolean;
  likerAvatars: string[];
  liveRoute?: boolean;
};

export type Community = {
  id: string;
  name: string;
  location: string;
  description: string;
  cover: string;
  members: number;
  activity?: string;
  category: "Touring" | "Technical" | "Meetup" | "All Regions";
  joined?: boolean;
  requested?: boolean;
  memberAvatars: string[];
};

export type RideEvent = {
  id: string;
  title: string;
  description: string;
  kind: "Ride" | "Workshop" | "Meetup" | "Tour";
  location: string;
  month: string;
  day: string;
  dateLabel: string;
  attending: number;
  cover: string;
  featured?: boolean;
};

export type Conversation = {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  preview: string;
  time: string;
  unread?: boolean;
  online?: boolean;
  group?: boolean;
};

export type ChatMessage = {
  id: string;
  fromMe: boolean;
  text?: string;
  image?: string;
  voice?: boolean;
  time: string;
};

export type AppNotification = {
  id: string;
  actor: string;
  avatar: string;
  body: string;
  time: string;
  unread?: boolean;
  href: string;
};

export type Hashtag = {
  tag: string;
  posts: string;
};
