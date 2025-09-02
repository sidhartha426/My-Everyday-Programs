command_start = 'aria2c -x 4 --file-allocation=none -d '

names_file = open('b.txt' , 'r')
links_file = open('c.txt' , 'r')
script_file = open('a.sh' , 'w')

names = names_file.readlines()
links = links_file.readlines()

names_file.close()
links_file.close()


for ind,name in enumerate(names):
    if name != '\n':
        script_file.write(f'{command_start} "{name[0:-1]}" {links[ind][0:-1]}\n')
    else:
        script_file.write('\n')
    
script_file.close()
