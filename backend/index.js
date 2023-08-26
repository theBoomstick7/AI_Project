const express = require('express');
const cors = require('cors');
const app = express()
require('dotenv').config()
const multer = require('multer')
const FormData= require('form-data');
const {Readable} = require('stream');
const upload = multer()

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

app.post('/api/transcribe', upload.single('file'), async (req,res) => {
    try {
        const audioFile = req.file;
        if(!audioFile){
            return res.status(400).json({error: 'No audio file provided'});
        }
        const formData = new FormData();
        const audioStream = bufferToStream(audioFile.buffer);
        formData.append('file', audioStream,{filename: 'audio.mp3', contentType: audioFile.mimetype});
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

