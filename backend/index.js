const express = require('express');
const cors = require('cors');
const app = express()
require('dotenv').config()
const multer = require('multer')
const FormData= require('form-data');
const {Readable} = require('stream');
const upload = multer()
const ffmetadata = require('ffmetadata');
const fs = require('fs');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);



app.use(cors());
app.use(express.json());

app.get('/', (req,res) => {
    res.send('Welcome to the Speech to text API!')
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const bufferToStream = (buffer) => {
    return Readable.from(buffer)
}

const parseTimeStringToSeconds = timeString => {
    const [minutes,seconds] = timeString.split(':').map(tm=> parseInt(tm));
    return minutes * 60 + seconds
}

app.post('/api/transcribe', upload.single('file'), async (req,res) => {
    const audioFile = req.file;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    
    if(!audioFile){
        return res.status(400).json({error: 'Audio file is required'});
    }

    if(!startTime || !endTime){
        return res.status(400).json({error: 'Start and end times are required.'})
    }

    const startSeconds = parseTimeStringToSeconds(startTime);
    const endSeconds = parseTimeStringToSeconds(endTime);
    const timeDuration = endSeconds -startSeconds

    try {
        const audioFile = req.file;
        if(!audioFile){
            return res.status(400).json({error: 'No audio file provided'});
        }
        const audioStream = bufferToStream(audioFile.buffer);

        const trimAudio = async (audioStream, endTime) => {
            const tempFileName = `temp-${Date.now()}.mp3`
            const outputFileName = `output-${Date.now()}.mp3`
            
            return new Promise((resolve,reject) => {
            audioStream.pipe(fs.createWriteStream(tempFileName))
            .on('finish', () => {
                    ffmetadata.read(tempFileName, (err, metadata) => {
                        if(err) reject(err);
                        
                        const duration = parseFloat(metadata.duration);
                        if(endTime > duration) endTime = duration
                        
                        ffmpeg(tempFileName)
                        .setStartTime(startSeconds)
                        .setDuration(timeDuration)
                        .output(outputFileName)
                        .on('end', () => {
                            fs.unlink(tempFileName, (err) => {
                                    if (err) console.error(`Error deleting temp file:`,err)
                                });
                                
                                const trimmedAudioBuffer = fs.readFileSync(outputFileName);
                                fs.unlink(outputFileName, (err) => {
                                    if (err) console.error(`Error deleting output file:`, err)
                                })
                                
                                resolve(trimmedAudioBuffer)
                            })
                            .on('error', reject)
                            .run()
                        })
                    })
                    .on('error',reject)
                })
                
            }
                
        
        const trimmedAudioBuffer = await trimAudio(audioStream, endTime);



        const formData = new FormData();
        
        formData.append('file', trimmedAudioBuffer,{filename: 'audio.mp3', contentType: audioFile.mimetype});
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'json')

        const headers = {
            "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
            "Authorization": `Bearer ${process.env.OPEN_API_KEY}`
        }

        const requestOptions = {
            method: 'POST',
            headers: headers,
            body: FormData
        }

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions',requestOptions);
        const data = await response.json();

        const transcription = data.text;
        res.json({transcription})
    } catch (error) {
        console.log(error)
        alert(error)
        res.status(500).json({ error: 'Error transcribing audio'})
    }
})

