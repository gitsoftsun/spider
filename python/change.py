fr1 = open("ganjijob.txt", 'r')
fr2 = open("ganji.job1.txt", 'r')
fw = open("ganji.job0.txt", 'w')

for line in fr2:
    fw.write(line)
for line in fr1:
    line = line.strip().split(',')
    del line[0]
    del line[0]
    line.append('2')
    entity = ','.join(line) + '\n'
    fw.write(entity)
fw.close()
