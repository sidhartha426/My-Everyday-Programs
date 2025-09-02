import pathlib

start_string = '''<?xml version="1.0" encoding="UTF-8"?>
<playlist xmlns="http://xspf.org/ns/0/" xmlns:vlc="http://www.videolan.org/vlc/playlist/ns/0/" version="1">
	<title>Playlist</title>
	<trackList>
	
'''
end_string1 = '''
</trackList>
	<extension application="http://www.videolan.org/vlc/playlist/0">
'''
end_string2 ='''
    	</extension>
</playlist>
'''
id=0

with open("playlist.txt","r") as input_file:
    with open("playlist.xspf","w") as output_file:
        output_file.write(start_string)
        for data in input_file:
            if data != "\n":
                file_string = f'''
            <track> 
                <location>{ data[0:-1] if '://' in data else pathlib.Path(data[0:-1]).as_uri() }</location>
			              <extension application="http://www.videolan.org/vlc/playlist/0">
				                <vlc:id>{id}</vlc:id>
			              </extension>
		        </track>
                 '''
                output_file.write(file_string)
                id+=1
        output_file.write(end_string1)


with open("playlist.xspf","a") as output_file:
    for t_id in range(0,id):
        output_file.write(f'<vlc:item tid="{t_id}"/>\n')
    output_file.write(end_string2)     
  

                
