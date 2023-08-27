import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'; // for file upload
import axios from 'axios'; // to make network request
import TimePicker from './TimePicker'; // our custom TimePicker
import { toast, ToastContainer } from 'react-toastify'; // for toast notification

// Helper functions (timeToSeconds, secondsToTime, timeToMinutesAndSeconds)

const TranscriptionPage = () => {
  const [uploading, setUploading] = useState(false);
  const [transcription, setTranscription] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:10:00'); // 10 minutes default endtime
  const [audioDuration, setAudioDuration] = useState(null);
}
