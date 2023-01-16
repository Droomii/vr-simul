if [ -z $1 ]
then
	echo "nonono!!";
	exit 1
fi

echo "https://query1.finance.yahoo.com/v7/finance/download/$1?period1=0&period2=`date +%s`&interval=1d&events=history&includeAdjustedClose=true"

curl "https://query1.finance.yahoo.com/v7/finance/download/$1?period1=0&period2=`date +%s`&interval=1d&events=history&includeAdjustedClose=true" > $1.csv