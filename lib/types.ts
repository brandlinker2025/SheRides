export type Rider = {
  id: string;
  username: string;
  fullName: string;
  bio: string;
  location: string;
  bike: string;
  bikeBrand?: string;
  bikeModel?: string;
  avatar: string;
  cover: string;
  verified: boolean;
  role: "rider" | "admin";
  hasBirthday?: boolean;
};
