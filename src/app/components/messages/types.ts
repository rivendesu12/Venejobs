export type Conversation = {
  conversation_id: string;
  proposal_id: number;
  proposal_status: string;
  offered_price: number | null;
  job_title: string;
  other_name: string;
  other_avatar: string | null;
  last_message_body: string | null;
  last_message_sent_at: string | null;
  unread_count: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string | number;
  body: string;
  sent_at: string;
  read_at: string | null;
  sender_name?: string;
  sender_avatar?: string | null;
};
