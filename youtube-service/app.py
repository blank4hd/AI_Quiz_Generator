from flask import Flask, request, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
import re
import os
import logging
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

def extract_video_id(url):
    """Extract video ID from various YouTube URL formats"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)',
        r'youtube\.com\/embed\/([^&\n?#]+)',
        r'youtube\.com\/v\/([^&\n?#]+)',
        r'youtube\.com\/shorts\/([^&\n?#]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok', 
        'service': 'youtube-transcript-service',
        'version': '1.0.0'
    })

@app.route('/transcript', methods=['POST'])
def get_transcript():
    """Fetch YouTube video transcript"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'YouTube URL is required'}), 400
        
        # Extract video ID
        video_id = extract_video_id(url)
        if not video_id:
            return jsonify({'error': 'Invalid YouTube URL'}), 400
        
        logger.info(f'Fetching transcript for video: {video_id}')
        
        # Try to get transcript
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        except VideoUnavailable:
            return jsonify({
                'error': 'Video is unavailable or does not exist'
            }), 404
        
        # Try to get English transcript first (manual)
        transcript = None
        try:
            transcript = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
            logger.info(f'Found manual English transcript: {transcript.language_code}')
        except:
            logger.info('No manual English transcript found, trying generated...')
            # Try auto-generated English
            try:
                transcript = transcript_list.find_generated_transcript(['en', 'en-US', 'en-GB'])
                logger.info(f'Found generated English transcript: {transcript.language_code}')
            except:
                logger.info('No English transcript found, trying any available...')
                # Get first available transcript
                try:
                    available = list(transcript_list)
                    if available:
                        transcript = available[0]
                        logger.info(f'Using transcript in language: {transcript.language_code}')
                except Exception as e:
                    logger.error(f'No transcripts available: {str(e)}')
        
        if not transcript:
            return jsonify({
                'error': 'No transcript available for this video. Please ensure the video has captions/subtitles enabled.'
            }), 404
        
        # Fetch the actual transcript data with retry logic
        max_retries = 3
        transcript_data = None
        last_error = None
        
        for attempt in range(max_retries):
            try:
                logger.info(f'Fetching transcript data (attempt {attempt + 1}/{max_retries})...')
                transcript_data = transcript.fetch()
                break  # Success, exit retry loop
            except Exception as fetch_error:
                last_error = str(fetch_error)
                logger.warning(f'Attempt {attempt + 1} failed: {last_error}')
                if attempt < max_retries - 1:
                    time.sleep(1)  # Wait before retry
                else:
                    logger.error(f'All {max_retries} attempts failed')
        
        if not transcript_data:
            error_msg = 'Failed to fetch transcript data'
            if 'ParseError' in str(last_error):
                error_msg = 'YouTube returned invalid transcript data. This video may have restrictions or the transcript format is not supported.'
            elif 'element found' in str(last_error):
                error_msg = 'Transcript data is empty or unavailable. The video may have disabled transcripts or may be region-restricted.'
            
            return jsonify({
                'error': error_msg,
                'details': last_error if os.environ.get('FLASK_ENV') == 'development' else None
            }), 500
        
        # Combine all text segments
        full_text = ' '.join([entry['text'] for entry in transcript_data])
        
        # Clean up the text
        full_text = ' '.join(full_text.split())  # Remove extra whitespace
        
        if not full_text or len(full_text) < 50:
            return jsonify({
                'error': 'Transcript is too short or empty'
            }), 422
        
        title = f"YouTube Video {video_id}"
        
        logger.info(f'Transcript fetched successfully. Length: {len(full_text)} characters, Language: {transcript.language_code}')
        
        return jsonify({
            'transcript': full_text,
            'title': title,
            'language': transcript.language_code,
            'videoId': video_id,
            'length': len(full_text)
        })
        
    except TranscriptsDisabled:
        logger.warning(f'Transcripts disabled for video: {video_id}')
        return jsonify({
            'error': 'Transcripts are disabled for this video'
        }), 404
    
    except NoTranscriptFound:
        logger.warning(f'No transcript found for video: {video_id}')
        return jsonify({
            'error': 'No transcript available for this video. Please ensure the video has captions/subtitles enabled.'
        }), 404
    
    except Exception as e:
        logger.error(f'Unexpected error: {str(e)}', exc_info=True)
        return jsonify({
            'error': 'Failed to fetch transcript',
            'details': str(e) if os.environ.get('FLASK_ENV') == 'development' else None
        }), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    logger.error(f'Internal server error: {str(e)}')
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f'''
╔════════════════════════════════════════════════════════╗
║  YouTube Transcript Service                            ║
║  Port: {port}                                          ║
║  Environment: {os.environ.get('FLASK_ENV', 'production')} ║
╚════════════════════════════════════════════════════════╝
    ''')
    
    app.run(host='0.0.0.0', port=port, debug=debug)
