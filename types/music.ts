export type MusicStatus = 'pending' | 'generating' | 'completed' | 'failed'

export interface Music {
  id: string
  user_id: string
  title: string | null
  prompt: string
  mood: string | null
  genre: string | null
  duration: number | null       // seconds
  file_path: string | null      // storage path: {user_id}/{filename}.mp3
  file_url: string | null       // public/signed URL
  cover_image_url: string | null // album cover image URL
  lyrics: string | null          // user-provided lyrics
  status: MusicStatus
  error_message: string | null
  created_at: string
  updated_at: string
}

export type MusicInsert = Pick<Music, 'user_id' | 'prompt'> &
  Partial<Pick<Music, 'title' | 'mood' | 'genre'>>

export type MusicUpdate = Partial<
  Pick<Music, 'title' | 'mood' | 'genre' | 'duration' | 'file_path' | 'file_url' | 'cover_image_url' | 'status' | 'error_message'>
>
