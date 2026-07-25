export interface Profile {
  id: string;
  name: string;
  phone_display: string;
  about: string;
  avatar_url: string;
  avatar_color: string;
  is_online: boolean;
  last_seen: string;
  is_favorite?: boolean;
}

export interface Reaction {
  emoji: string;
  user_id: string;
  count: number;
}

export interface PollOption {
  id: string;
  text: string;
  voter_ids: string[];
}

export interface PollData {
  question: string;
  options: PollOption[];
  allow_multiple: boolean;
  created_by: string;
}

export interface VoiceNote {
  url: string;
  duration_sec: number;
  waveform: number[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'poll' | 'voice';
  created_at: string;
  media_url?: string;
  media_name?: string;
  media_size?: number;
  duration_sec?: number;
  reply_to?: string | null;
  status?: 'sent' | 'delivered' | 'read';
  reactions?: Reaction[];
  poll?: PollData;
  voice?: VoiceNote;
}

export interface Conversation {
  id: string;
  is_group: boolean;
  name?: string;
  avatar_url?: string;
  member_ids: string[];
  last_message_at: string;
  unread_count: number;
  group_description?: string;
}

export interface StatusStory {
  id: string;
  profile_id: string;
  media_url: string;
  caption?: string;
  created_at: string;
  duration_ms: number;
  viewed: boolean;
}

export type Theme = 'light' | 'dark';

const AVATAR_COLORS = [
  '#128C7E', '#075E54', '#25D366', '#34B7F1', '#7E57C2',
  '#EC407A', '#EF5350', '#FF7043', '#FFA726', '#66BB6A',
  '#26A69A', '#5C6BC0',
];

export const CURRENT_USER_ID = 'self';
const REACTIONS_SET = ['❤️', '👍', '😂', '🔥'];

export const DEFAULT_PROFILES: Profile[] = [
  { id: 'p1', name: 'Sophia Martinez', phone_display: '+1 555 0101', about: 'Living my best life ✨', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces', avatar_color: AVATAR_COLORS[0], is_online: true, last_seen: new Date().toISOString(), is_favorite: true },
  { id: 'p2', name: 'James Chen', phone_display: '+1 555 0102', about: 'Coffee addict ☕ | Developer', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces', avatar_color: AVATAR_COLORS[1], is_online: true, last_seen: new Date().toISOString(), is_favorite: true },
  { id: 'p3', name: 'Olivia Johnson', phone_display: '+1 555 0103', about: 'Travel enthusiast 🌍', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=faces', avatar_color: AVATAR_COLORS[2], is_online: false, last_seen: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 'p4', name: 'Liam Anderson', phone_display: '+1 555 0104', about: 'Dad. Husband. Gamer. 🎮', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces', avatar_color: AVATAR_COLORS[3], is_online: false, last_seen: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'p5', name: 'Ava Thompson', phone_display: '+1 555 0105', about: 'Designer | Dreamer 💭', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces', avatar_color: AVATAR_COLORS[4], is_online: true, last_seen: new Date().toISOString(), is_favorite: true },
  { id: 'p6', name: 'Noah Williams', phone_display: '+1 555 0106', about: 'Fitness 💪 | Foodie', avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces', avatar_color: AVATAR_COLORS[5], is_online: false, last_seen: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'p7', name: 'Emma Davis', phone_display: '+1 555 0107', about: 'Book lover 📚 | Cat mom', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=faces', avatar_color: AVATAR_COLORS[6], is_online: true, last_seen: new Date().toISOString() },
  { id: 'p8', name: 'Benjamin Lee', phone_display: '+1 555 0108', about: 'Music is therapy 🎵', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces', avatar_color: AVATAR_COLORS[7], is_online: false, last_seen: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'p9', name: 'Mia Rodriguez', phone_display: '+1 555 0109', about: 'Yoga 🧘‍♀️ | Nature 🌿', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=faces', avatar_color: AVATAR_COLORS[8], is_online: true, last_seen: new Date().toISOString() },
  { id: 'p10', name: 'Ethan Brown', phone_display: '+1 555 0110', about: 'Entrepreneur 💼', avatar_url: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=faces', avatar_color: AVATAR_COLORS[9], is_online: false, last_seen: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'p11', name: 'Isabella Garcia', phone_display: '+1 555 0111', about: 'Artist at heart 🎨', avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=faces', avatar_color: AVATAR_COLORS[10], is_online: true, last_seen: new Date().toISOString() },
  { id: 'p12', name: 'Lucas Miller', phone_display: '+1 555 0112', about: 'Photographer 📸', avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=faces', avatar_color: AVATAR_COLORS[11], is_online: false, last_seen: new Date(Date.now() - 12 * 3600000).toISOString() },
];

const INITIAL_CONVERSATIONS: Conversation[] = [
  { id: 'conv-p1', is_group: false, member_ids: [CURRENT_USER_ID, 'p1'], last_message_at: new Date(Date.now() - 5 * 60000).toISOString(), unread_count: 2 },
  { id: 'conv-p2', is_group: false, member_ids: [CURRENT_USER_ID, 'p2'], last_message_at: new Date(Date.now() - 35 * 60000).toISOString(), unread_count: 0 },
  { id: 'g-design', is_group: true, name: 'Design Crew 🎨', avatar_url: undefined, group_description: 'Team for the upcoming product redesign', member_ids: [CURRENT_USER_ID, 'p5', 'p11', 'p1'], last_message_at: new Date(Date.now() - 1.5 * 3600000).toISOString(), unread_count: 3 },
  { id: 'conv-p5', is_group: false, member_ids: [CURRENT_USER_ID, 'p5'], last_message_at: new Date(Date.now() - 2 * 3600000).toISOString(), unread_count: 5 },
  { id: 'g-weekend', is_group: true, name: 'Weekend Plans 🎉', avatar_url: undefined, group_description: 'Organizing the getaway', member_ids: [CURRENT_USER_ID, 'p2', 'p7', 'p9', 'p12'], last_message_at: new Date(Date.now() - 5 * 3600000).toISOString(), unread_count: 1 },
  { id: 'conv-p7', is_group: false, member_ids: [CURRENT_USER_ID, 'p7'], last_message_at: new Date(Date.now() - 1 * 86400000 + 3 * 3600000).toISOString(), unread_count: 0 },
  { id: 'conv-p9', is_group: false, member_ids: [CURRENT_USER_ID, 'p9'], last_message_at: new Date(Date.now() - 2 * 86400000).toISOString(), unread_count: 1 },
  { id: 'conv-p11', is_group: false, member_ids: [CURRENT_USER_ID, 'p11'], last_message_at: new Date(Date.now() - 3 * 86400000).toISOString(), unread_count: 0 },
];

function randWaveform(len: number): number[] {
  return Array.from({ length: len }, () => 0.25 + Math.random() * 0.75);
}

function genInitialMessages(): Message[] {
  const msgs: Message[] = [];
  const now = Date.now();

  // Conv p1
  msgs.push({ id: 'm1', conversation_id: 'conv-p1', sender_id: 'p1', body: "Hey! How's it going? Haven't heard from you in a while 😊", type: 'text', created_at: new Date(now - 20 * 60000).toISOString(), status: 'read' });
  msgs.push({ id: 'm2', conversation_id: 'conv-p1', sender_id: CURRENT_USER_ID, body: "Hi Sophia! I'm doing great, just been really busy with work lately. How about you?", type: 'text', created_at: new Date(now - 18 * 60000).toISOString(), status: 'read', reactions: [{ emoji: '❤️', user_id: 'p1', count: 1 }] });
  msgs.push({ id: 'm3', conversation_id: 'conv-p1', sender_id: 'p1', body: "That's good to hear! I've been working on a new painting project. Super excited about it 🎨", type: 'text', created_at: new Date(now - 10 * 60000).toISOString(), status: 'read' });
  msgs.push({ id: 'm4', conversation_id: 'conv-p1', sender_id: 'p1', body: "Do you want to catch up for coffee this weekend?", type: 'text', created_at: new Date(now - 5 * 60000).toISOString(), status: 'delivered' });

  // Conv p2
  msgs.push({ id: 'm5', conversation_id: 'conv-p2', sender_id: CURRENT_USER_ID, body: "Did you manage to fix that bug we were talking about?", type: 'text', created_at: new Date(now - 60 * 60000).toISOString(), status: 'read' });
  msgs.push({ id: 'm6', conversation_id: 'conv-p2', sender_id: 'p2', body: "Yeah! Turns out it was a missing await in the promise chain 😅", type: 'text', created_at: new Date(now - 55 * 60000).toISOString(), status: 'read', reactions: [{ emoji: '😂', user_id: CURRENT_USER_ID, count: 1 }] });
  msgs.push({ id: 'm7', conversation_id: 'conv-p2', sender_id: CURRENT_USER_ID, body: "Haha classic! Happens to the best of us 👍", type: 'text', created_at: new Date(now - 35 * 60000).toISOString(), status: 'read' });

  // Design group
  msgs.push({ id: 'm8', conversation_id: 'g-design', sender_id: 'p5', body: "Good morning team! Just dropped the new mockups in the drive 🌟", type: 'text', created_at: new Date(now - 3 * 3600000).toISOString(), status: 'read' });
  msgs.push({ id: 'm9', conversation_id: 'g-design', sender_id: 'p11', body: "Loving the hero section! The gradient palette is *chef's kiss*", type: 'text', created_at: new Date(now - 2.6 * 3600000).toISOString(), status: 'read', reactions: [{ emoji: '🔥', user_id: 'p5', count: 1 }, { emoji: '👍', user_id: CURRENT_USER_ID, count: 1 }] });
  msgs.push({ id: 'm10', conversation_id: 'g-design', sender_id: CURRENT_USER_ID, type: 'poll', body: '', poll: { question: 'Which direction should we go for the launch landing?', options: [ { id: 'po1', text: 'Glassmorphism (Premium feel)', voter_ids: ['p5', 'p11'] }, { id: 'po2', text: 'Minimal flat (Fast build)', voter_ids: [] }, { id: 'po3', text: 'Hybrid — both themes', voter_ids: [CURRENT_USER_ID, 'p1'] } ], allow_multiple: false, created_by: CURRENT_USER_ID }, created_at: new Date(now - 2 * 3600000).toISOString(), status: 'delivered' });
  msgs.push({ id: 'm10b', conversation_id: 'g-design', sender_id: 'p1', body: "Definitely hybrid! Love the glass idea 👍", type: 'text', created_at: new Date(now - 1.8 * 3600000).toISOString(), status: 'delivered' });
  msgs.push({ id: 'm10c', conversation_id: 'g-design', sender_id: 'p5', body: "Agreed, hybrid gives the judges the best of both worlds 🔥", type: 'text', created_at: new Date(now - 1.5 * 3600000).toISOString(), status: 'delivered' });

  // Conv p5
  msgs.push({ id: 'm11', conversation_id: 'conv-p5', sender_id: 'p5', body: "Just saw this design inspiration and thought of you! 🤩", type: 'text', created_at: new Date(now - 5 * 3600000).toISOString(), status: 'read' });
  msgs.push({ id: 'm12', conversation_id: 'conv-p5', sender_id: 'p5', body: "The color palette is so similar to what you were describing last week", type: 'text', created_at: new Date(now - 4 * 3600000).toISOString(), status: 'read' });
  msgs.push({ id: 'm13', conversation_id: 'conv-p5', sender_id: 'p5', body: "Let me know what you think when you get a chance!", type: 'text', created_at: new Date(now - 3 * 3600000).toISOString(), status: 'delivered' });
  msgs.push({ id: 'm14', conversation_id: 'conv-p5', sender_id: 'p5', body: "Also, are you going to the design meetup next Tuesday?", type: 'text', created_at: new Date(now - 2.5 * 3600000).toISOString(), status: 'delivered' });
  msgs.push({ id: 'm15', conversation_id: 'conv-p5', sender_id: 'p5', body: "Would love to see you there! 💫", type: 'text', created_at: new Date(now - 2 * 3600000).toISOString(), status: 'delivered' });

  // Weekend group
  msgs.push({ id: 'm16', conversation_id: 'g-weekend', sender_id: 'p9', body: "Who's in for the cabin trip this weekend? 🌲", type: 'text', created_at: new Date(now - 7 * 3600000).toISOString(), status: 'read' });
  msgs.push({ id: 'm17', conversation_id: 'g-weekend', sender_id: 'p2', body: "Count me in! I'll bring the games 🎲", type: 'text', created_at: new Date(now - 6.4 * 3600000).toISOString(), status: 'read' });
  msgs.push({ id: 'm18', conversation_id: 'g-weekend', sender_id: 'p7', body: "Same here, I'll bring snacks and my portable speaker 😊", type: 'text', created_at: new Date(now - 6 * 3600000).toISOString(), status: 'read' });
  msgs.push({ id: 'm19', conversation_id: 'g-weekend', sender_id: 'p12', type: 'image', media_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80', media_name: 'cabin-view.jpg', media_size: 312000, body: "Look at the view from the cabin!", created_at: new Date(now - 5.2 * 3600000).toISOString(), status: 'delivered', reactions: [{ emoji: '🔥', user_id: 'p7', count: 1 }, { emoji: '❤️', user_id: CURRENT_USER_ID, count: 1 }] });
  msgs.push({ id: 'm20', conversation_id: 'g-weekend', sender_id: 'p9', type: 'voice', body: '', voice: { url: '', duration_sec: 6, waveform: randWaveform(20) }, created_at: new Date(now - 5 * 3600000).toISOString(), status: 'delivered' });

  // Conv p7
  msgs.push({ id: 'm21', conversation_id: 'conv-p7', sender_id: 'p7', body: "Have you read any good books lately? Looking for recommendations 📚", type: 'text', created_at: new Date(now - 1.2 * 86400000).toISOString(), status: 'read' });
  msgs.push({ id: 'm22', conversation_id: 'conv-p7', sender_id: CURRENT_USER_ID, body: "Oh I just finished Project Hail Mary by Andy Weir! Absolutely fantastic, could not put it down. Highly recommend!", type: 'text', created_at: new Date(now - 1.1 * 86400000).toISOString(), status: 'read' });
  msgs.push({ id: 'm23', conversation_id: 'conv-p7', sender_id: 'p7', body: "Adding it to my list right now! Thanks for the rec 😊", type: 'text', created_at: new Date(now - 1 * 86400000 + 3 * 3600000).toISOString(), status: 'read' });

  // Conv p9
  msgs.push({ id: 'm24', conversation_id: 'conv-p9', sender_id: 'p9', body: "Hey! Are we still on for yoga at 6pm tomorrow?", type: 'text', created_at: new Date(now - 2 * 86400000).toISOString(), status: 'delivered' });

  // Conv p11
  msgs.push({ id: 'm25', conversation_id: 'conv-p11', sender_id: CURRENT_USER_ID, body: "Your last art piece was absolutely stunning! 🔥", type: 'text', created_at: new Date(now - 3.2 * 86400000).toISOString(), status: 'read' });
  msgs.push({ id: 'm26', conversation_id: 'conv-p11', sender_id: 'p11', body: "Aww thank you so much! That means the world to me 🥰", type: 'text', created_at: new Date(now - 3 * 86400000).toISOString(), status: 'read', reactions: [{ emoji: '❤️', user_id: CURRENT_USER_ID, count: 1 }] });

  return msgs;
}

function genInitialStatuses(): StatusStory[] {
  const now = Date.now();
  return [
    { id: 's1', profile_id: 'p1', media_url: 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?w=1000&q=80', caption: 'Studio vibes ✨', created_at: new Date(now - 15 * 60000).toISOString(), duration_ms: 5000, viewed: false },
    { id: 's2', profile_id: 'p5', media_url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1000&q=80', caption: 'Color experiments 🎨', created_at: new Date(now - 45 * 60000).toISOString(), duration_ms: 5000, viewed: false },
    { id: 's3', profile_id: 'p9', media_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1000&q=80', caption: 'Morning flow 🧘‍♀️', created_at: new Date(now - 2 * 3600000).toISOString(), duration_ms: 5000, viewed: true },
    { id: 's4', profile_id: 'p11', media_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1000&q=80', caption: 'New piece in progress...', created_at: new Date(now - 4 * 3600000).toISOString(), duration_ms: 5000, viewed: false },
    { id: 's5', profile_id: 'p12', media_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1000&q=80', caption: 'Into the wild 📸', created_at: new Date(now - 6 * 3600000).toISOString(), duration_ms: 5000, viewed: true },
    { id: 's6', profile_id: 'p7', media_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1000&q=80', caption: 'Weekend reading 📖', created_at: new Date(now - 10 * 3600000).toISOString(), duration_ms: 5000, viewed: false },
  ];
}

const LS_KEYS = {
  profiles: 'wa_profiles_v2',
  conversations: 'wa_conversations_v2',
  messages: 'wa_messages_v2',
  theme: 'wa_theme_v2',
  seeded: 'wa_seeded_v2',
  currentUser: 'wa_current_user_v2',
  statuses: 'wa_statuses_v2',
  active_sidebar_tab: 'wa_tab_v2',
};

export type SidebarTab = 'all' | 'unread' | 'groups' | 'favorites' | 'status';

export function getCurrentUser(): Profile {
  const raw = localStorage.getItem(LS_KEYS.currentUser);
  if (raw) return JSON.parse(raw);
  const me: Profile = {
    id: CURRENT_USER_ID,
    name: 'You',
    phone_display: '+1 555 0000',
    about: 'Hey there! I am using WhatsApp.',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=faces',
    avatar_color: AVATAR_COLORS[0],
    is_online: true,
    last_seen: new Date().toISOString(),
  };
  localStorage.setItem(LS_KEYS.currentUser, JSON.stringify(me));
  return me;
}

export function saveCurrentUser(p: Profile) {
  localStorage.setItem(LS_KEYS.currentUser, JSON.stringify(p));
}

export function getActiveTab(): SidebarTab {
  return (localStorage.getItem(LS_KEYS.active_sidebar_tab) as SidebarTab) || 'all';
}

export function saveActiveTab(tab: SidebarTab) {
  localStorage.setItem(LS_KEYS.active_sidebar_tab, tab);
}

export function seedIfNeeded() {
  if (localStorage.getItem(LS_KEYS.seeded)) return;
  localStorage.setItem(LS_KEYS.profiles, JSON.stringify(DEFAULT_PROFILES));
  localStorage.setItem(LS_KEYS.conversations, JSON.stringify(INITIAL_CONVERSATIONS));
  localStorage.setItem(LS_KEYS.messages, JSON.stringify(genInitialMessages()));
  localStorage.setItem(LS_KEYS.statuses, JSON.stringify(genInitialStatuses()));
  localStorage.setItem(LS_KEYS.seeded, 'true');
}

export function getProfiles(): Profile[] {
  seedIfNeeded();
  const raw = localStorage.getItem(LS_KEYS.profiles);
  return raw ? JSON.parse(raw) : [];
}

export function getConversations(): Conversation[] {
  seedIfNeeded();
  const raw = localStorage.getItem(LS_KEYS.conversations);
  return raw ? JSON.parse(raw) : [];
}

export function saveConversations(convs: Conversation[]) {
  localStorage.setItem(LS_KEYS.conversations, JSON.stringify(convs));
}

export function getMessages(): Message[] {
  seedIfNeeded();
  const raw = localStorage.getItem(LS_KEYS.messages);
  return raw ? JSON.parse(raw) : [];
}

export function saveMessages(msgs: Message[]) {
  localStorage.setItem(LS_KEYS.messages, JSON.stringify(msgs));
}

export function getStatuses(): StatusStory[] {
  seedIfNeeded();
  const raw = localStorage.getItem(LS_KEYS.statuses);
  return raw ? JSON.parse(raw) : [];
}

export function saveStatuses(list: StatusStory[]) {
  localStorage.setItem(LS_KEYS.statuses, JSON.stringify(list));
}

export function markStatusViewed(statusId: string) {
  const list = getStatuses();
  const s = list.find((x) => x.id === statusId);
  if (s) {
    s.viewed = true;
    saveStatuses(list);
  }
}

export function getMessagesForConversation(convId: string): Message[] {
  return getMessages().filter((m) => m.conversation_id === convId);
}

export function getOrCreateConversation(profileId: string): Conversation {
  const convs = getConversations();
  let conv = convs.find(
    (c) => !c.is_group && c.member_ids.includes(CURRENT_USER_ID) && c.member_ids.includes(profileId)
  );
  if (!conv) {
    conv = {
      id: `conv-${profileId}`,
      is_group: false,
      member_ids: [CURRENT_USER_ID, profileId],
      last_message_at: new Date().toISOString(),
      unread_count: 0,
    };
    convs.unshift(conv);
    saveConversations(convs);
  }
  return conv;
}

export function createMessage(conversation_id: string, patch: Partial<Message> & { body: string; type: Message['type'] }): Message {
  const msgs = getMessages();
  const msg: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    conversation_id,
    sender_id: CURRENT_USER_ID,
    created_at: new Date().toISOString(),
    status: 'sent',
    reply_to: null,
    reactions: [],
    ...patch,
  };
  msgs.push(msg);
  saveMessages(msgs);
  bumpConv(conversation_id);
  return msg;
}

function bumpConv(conversationId: string) {
  const convs = getConversations();
  const idx = convs.findIndex((c) => c.id === conversationId);
  if (idx >= 0) {
    convs[idx].last_message_at = new Date().toISOString();
    const [moved] = convs.splice(idx, 1);
    convs.unshift(moved);
    saveConversations(convs);
  }
}

export function sendMessage(conversationId: string, body: string, replyTo: string | null = null): Message {
  return createMessage(conversationId, { body, type: 'text', reply_to: replyTo, status: 'sent' });
}

export function sendPoll(conversationId: string, poll: PollData): Message {
  return createMessage(conversationId, { body: '', type: 'poll', poll });
}

export function sendVoice(conversationId: string, voice: VoiceNote): Message {
  return createMessage(conversationId, { body: '', type: 'voice', voice, duration_sec: voice.duration_sec });
}

export function sendImage(conversationId: string, media_url: string, body = ''): Message {
  return createMessage(conversationId, { body, type: 'image', media_url });
}

export function markConversationRead(convId: string) {
  const convs = getConversations();
  const conv = convs.find((c) => c.id === convId);
  if (conv) {
    conv.unread_count = 0;
    saveConversations(convs);
  }
  const msgs = getMessages();
  let changed = false;
  msgs.forEach((m) => {
    if (m.conversation_id === convId && m.sender_id !== CURRENT_USER_ID && m.status !== 'read') {
      m.status = 'read';
      changed = true;
    }
  });
  if (changed) saveMessages(msgs);
}

export function updateMessageStatus(msgId: string, status: 'sent' | 'delivered' | 'read') {
  const msgs = getMessages();
  const m = msgs.find((x) => x.id === msgId);
  if (m) {
    m.status = status;
    saveMessages(msgs);
  }
}

export function incrementUnread(convId: string, amount = 1) {
  const convs = getConversations();
  const conv = convs.find((c) => c.id === convId);
  if (conv) {
    conv.unread_count = (conv.unread_count || 0) + amount;
    saveConversations(convs);
  }
}

export function getTheme(): Theme {
  const raw = localStorage.getItem(LS_KEYS.theme);
  return (raw as Theme) || 'light';
}

export function saveTheme(t: Theme) {
  localStorage.setItem(LS_KEYS.theme, t);
}

export function getProfile(id: string): Profile | undefined {
  if (id === CURRENT_USER_ID) return getCurrentUser();
  return getProfiles().find((p) => p.id === id);
}

const AUTO_REPLIES: Record<string, string[]> = {
  default: [
    "That's interesting! Tell me more 🤔",
    "Haha, I totally get what you mean 😄",
    "Oh wow, really? That's amazing!",
    "Hmm, let me think about that for a moment...",
    "I completely agree with you on that one! 👍",
    "That reminds me of something that happened last week lol",
    "No way! Are you serious? 😲",
    "Thanks for letting me know! 🙏",
    "I was literally just thinking about the same thing!",
    "Aww that's so sweet of you to say 🥰",
    "Okay, that sounds like a plan to me!",
    "Oh really? What made you do that?",
    "I can't wait to hear more about it!",
    "That actually makes a lot of sense, thanks for explaining",
    "Haha you always know exactly what to say 😂",
    "Let me get back to you on that one, okay?",
    "Omg that's so cool! 🎉",
    "I appreciate you taking the time to share that",
    "Life has its funny moments, doesn't it? 😊",
    "I'll definitely keep that in mind!",
  ],
  greetings: [
    "Hey there! So good to hear from you! 👋",
    "Hi! How's your day going so far?",
    "Hello! It's been too long! Missed talking to you 😊",
    "Hey hey! What's up?",
    "Hi friend! Good to see you online! ✨",
  ],
  questions: [
    "Great question! Honestly, I think it really depends...",
    "Hmm, I'd have to say it's a mix of both things 🤔",
    "Personally, I've always felt that way too about it",
    "What made you think about that, if you don't mind me asking?",
    "From my experience, it usually works out if you give it time",
  ],
  plans: [
    "That sounds amazing! Count me in! 🎉",
    "I'd love to! What time and where?",
    "Let me check my schedule and get back to you ASAP",
    "Oh I wish I could, but I already have plans 😔 Maybe next time!",
    "Sure thing! Just let me know the details 💯",
  ],
};

function getRandomReply(userMessage: string): string {
  const msg = userMessage.toLowerCase().trim();
  const greetingWords = ['hi', 'hey', 'hello', 'hola', 'yo', 'sup', 'good morning', 'good afternoon', 'good evening'];
  if (greetingWords.some((g) => msg.startsWith(g) || msg === g)) {
    return AUTO_REPLIES.greetings[Math.floor(Math.random() * AUTO_REPLIES.greetings.length)];
  }
  if (msg.endsWith('?') || msg.includes('?') || ['what', 'how', 'why', 'when', 'where', 'do you', 'can you', 'have you'].some((w) => msg.includes(w))) {
    return AUTO_REPLIES.questions[Math.floor(Math.random() * AUTO_REPLIES.questions.length)];
  }
  const planWords = ['meet', 'lunch', 'dinner', 'coffee', 'movie', 'go', 'party', 'weekend', 'tomorrow', 'tonight', 'yoga', 'hang'];
  if (planWords.some((w) => msg.includes(w))) {
    return AUTO_REPLIES.plans[Math.floor(Math.random() * AUTO_REPLIES.plans.length)];
  }
  return AUTO_REPLIES.default[Math.floor(Math.random() * AUTO_REPLIES.default.length)];
}

export function scheduleAutoReply(conversationId: string, fromProfileId: string): Promise<Message> {
  return new Promise((resolve) => {
    const delay = 1200 + Math.random() * 2800;
    setTimeout(() => {
      const msgs = getMessages();
      const userLastMsgs = msgs
        .filter((m) => m.conversation_id === conversationId && m.sender_id === CURRENT_USER_ID && !m.body.startsWith('/poll') && m.type === 'text')
        .slice(-3);
      const last = userLastMsgs[userLastMsgs.length - 1];
      const body = last ? getRandomReply(last.body) : 'Hey!';
      const reply: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        conversation_id: conversationId,
        sender_id: fromProfileId,
        body,
        type: 'text',
        created_at: new Date().toISOString(),
        reply_to: null,
        status: 'delivered',
        reactions: Math.random() > 0.55 ? [{ emoji: REACTIONS_SET[Math.floor(Math.random() * REACTIONS_SET.length)], user_id: CURRENT_USER_ID, count: 1 }] : undefined,
      };
      msgs.push(reply);
      saveMessages(msgs);
      bumpConv(conversationId);
      resolve(reply);
    }, delay);
  });
}

export function deleteMessage(msgId: string) {
  const msgs = getMessages().filter((m) => m.id !== msgId);
  saveMessages(msgs);
  const convs = getConversations();
  convs.forEach((c) => {
    const last = msgs
      .filter((m) => m.conversation_id === c.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    if (last) c.last_message_at = last.created_at;
  });
  saveConversations(convs);
}

export function toggleReaction(msgId: string, emoji: string, userId: string) {
  const msgs = getMessages();
  const m = msgs.find((x) => x.id === msgId);
  if (!m) return;
  if (!m.reactions) m.reactions = [];
  const idx = m.reactions.findIndex((r) => r.emoji === emoji && r.user_id === userId);
  if (idx >= 0) {
    m.reactions.splice(idx, 1);
  } else {
    const existing = m.reactions.find((r) => r.emoji === emoji);
    if (existing) {
      existing.count += 1;
    } else {
      m.reactions.push({ emoji, user_id: userId, count: 1 });
    }
  }
  saveMessages(msgs);
}

export function castPollVote(msgId: string, optionId: string, userId: string) {
  const msgs = getMessages();
  const m = msgs.find((x) => x.id === msgId);
  if (!m || !m.poll) return;
  if (!m.poll.allow_multiple) {
    m.poll.options.forEach((opt) => {
      opt.voter_ids = opt.voter_ids.filter((v) => v !== userId);
    });
  }
  const opt = m.poll.options.find((o) => o.id === optionId);
  if (opt) {
    if (opt.voter_ids.includes(userId)) {
      opt.voter_ids = opt.voter_ids.filter((v) => v !== userId);
    } else {
      opt.voter_ids.push(userId);
    }
  }
  saveMessages(msgs);
}

export function resetAllData() {
  Object.values(LS_KEYS).forEach((k) => localStorage.removeItem(k));
  seedIfNeeded();
  getCurrentUser();
}
