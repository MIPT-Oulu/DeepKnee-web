for scr in $(ls /tmp/uscreens/S-$USER)
do
    screen -X -S $scr quit
done

for scr in $(ls  /run/screen/S-$USER)
do
    screen -X -S $scr quit
done

cd src_web
npm install
npm run build
cd ..

screen -dmS deepknee_app && screen -S deepknee_app -X stuff "source activate deep_knee_web && cd src_web && python run_service.py 2>&1\n"
