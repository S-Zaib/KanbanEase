export type Database = {
    public: {
      Tables: {
        boards: {
          Row: {
            id: string;
            name: string;
            user_id: string;
            created_at: string;
          };
          Insert: {
            id?: string;
            name: string;
            user_id: string;
            created_at?: string;
          };
          Update: {
            id?: string;
            name?: string;
            user_id?: string;
            created_at?: string;
          };
        };
        lists: {
          Row: {
            id: string;
            board_id: string;
            name: string;
            created_at: string;
          };
          Insert: {
            id?: string;
            board_id: string;
            name: string;
            created_at?: string;
          };
          Update: {
            id?: string;
            board_id?: string;
            name?: string;
            created_at?: string;
          };
        };
        tasks: {
          Row: {
            id: string;
            list_id: string;
            title: string;
            description: string | null;
            created_at: string;
          };
          Insert: {
            id?: string;
            list_id: string;
            title: string;
            description?: string;
            created_at?: string;
          };
          Update: {
            id?: string;
            list_id?: string;
            title?: string;
            description?: string;
            created_at?: string;
          };
        };
      };
    };
  };

