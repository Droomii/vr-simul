if [ -z $1 ]
then
	echo "티커를 지정해 주세요.";
	exit 1
fi

curl "https://query1.finance.yahoo.com/v7/finance/download/$1?period1=0&period2=`date +%s`&interval=1d&events=history&includeAdjustedClose=true" > $1.csv
curl "https://query1.finance.yahoo.com/v7/finance/download/$1?period1=0&period2=`date +%s`&interval=1d&events=split&includeAdjustedClose=true" > $1"_split.csv"
