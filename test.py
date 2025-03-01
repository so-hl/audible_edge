from pydub import AudioSegment
from pydub.playback import play

sound = AudioSegment.from_file("sounds/beep.mp3")
play(sound)
