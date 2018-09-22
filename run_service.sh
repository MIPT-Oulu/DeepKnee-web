for scr in $(ls /tmp/uscreens/S-$USER)
do
    screen -X -S $scr quit
done

for scr in $(ls  /run/screen/S-$USER)
do
    screen -X -S $scr quit
done

cd src_web && npm run build && cd ..

screen -dmS dkw_backend && screen -S dkw_backend -X stuff "source activate deep_knee_web && cd src_backend && python main.py 2>&1\n"
screen -dmS dkw_frontend && screen -S dkw_frontend -X stuff "source activate deep_knee_web && cd src_web && python run.py 2>&1\n"
