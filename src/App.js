import "bootstrap/dist/css/bootstrap.min.css";
import './App.css';
import {message, Select, Slider, Table} from "antd";
import {Faker, pl, en, fr} from '@faker-js/faker';
import { useEffect, useState} from "react";

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
}

const columns = [
    {
        title: 'Index',
        dataIndex: 'index',
        key: 'index',
        render: (text, record, index) => index,
    },
    {
        title: 'Identifier',
        dataIndex: 'randomIdentifier',
        key: 'randomIdentifier',
    },
    {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
    },
    {
        title: 'Address',
        dataIndex: 'address',
        key: 'address',
    },
    {
        title: 'Phone',
        key: 'phone',
        dataIndex: 'phone',
    },
];


function App() {

    const [region, setRegion] = useState("EN")
    const handleChange = (value) => {
        console.log(`selected ${value}`);
        setRegion(value)
    };

    const regions = [
        {
            name: "USA",
            locale: "EN"
        },
        {
            name: "Poland",
            locale: "PL",
        },
        {
            name: "France",
            locale: "FR",
        },
    ]
    const customFaker = new Faker({
        locale: region === "PL" ? pl : region === "EN" ? en : region === "FR" ? fr : en,
    });
    const formatPhoneToUS = (phoneNumber) => {
        const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
        const match = cleanPhoneNumber.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
        }
        return phoneNumber;
    };

    const formatPhoneToFrance = (phoneNumber) => {
        const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
        const match = cleanPhoneNumber.match(/^(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})$/);
        if (match) {
            return `+33 ${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
        }
        return phoneNumber;
    };
    const formatPhonePolish = (phoneNumber) => {
        const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
        const match = cleanPhoneNumber.match(/^(\d{2})(\d{3})(\d{2})(\d{2})$/);
        if (match) {
            return `+48 ${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
        }
        return phoneNumber;
    };
    const [seedData, setSeedData] = useState({});

    const dataGenerator = (region, seed, errorAmount, recordsPerPage) => {
        customFaker.seed(parseInt(seed, 10));
        console.log(customFaker.seed(parseInt(seed, 10)), "AAAAAA")
        const data = [];
        for (let i = 0; i < recordsPerPage; i++) {
            const randomIdentifier = customFaker.string.uuid();
            let name = customFaker.person.fullName();
            let address = customFaker.location.streetAddress();
            let phone = region === "PL" ? formatPhonePolish(customFaker.phone.number()) : region === "EN" ? formatPhoneToUS(customFaker.phone.number()) : region === "FR" ? formatPhoneToFrance(customFaker.phone.number()) : formatPhoneToUS(customFaker.phone.number());

            if (errorAmount > 0) {
                const addressError = Math.random() <= errorAmount;
                const phoneError = Math.random() <= errorAmount;

                var erroneousName = name;
                for (let j = 0; j < errorAmount; j++) {
                    const randomIndex = Math.floor(Math.random() * erroneousName.length);
                    const randomError = Math.floor(Math.random() * 3);

                    switch (randomError) {
                        case 0:
                            erroneousName = erroneousName.substring(0, randomIndex) + erroneousName.substring(randomIndex + 1);
                            break;
                        case 1:
                            const randomCharacter = customFaker.string.alphaNumeric;
                            erroneousName = erroneousName.substring(0, randomIndex) + randomCharacter + erroneousName.substring(randomIndex);
                            break;
                        case 2:
                            if (randomIndex < erroneousName.length - 1) {
                                const charArray = erroneousName.split('');
                                const temp = charArray[randomIndex];
                                charArray[randomIndex] = charArray[randomIndex + 1];
                                charArray[randomIndex + 1] = temp;
                                erroneousName = charArray.join('');
                            }
                            break;
                        default:
                            break;
                    }
                }

                if (addressError) {
                    const addressArray = Array.from(address);
                    const errorIndex = Math.floor(Math.random() * (addressArray.length + 1));
                    const errorCharacter = customFaker.string.alphaNumeric;
                    addressArray.splice(errorIndex, 0, errorCharacter);
                    address = addressArray.join('');
                }

                if (phoneError) {
                    const phoneArray = Array.from(phone);
                    const errorIndex = Math.floor(Math.random() * (phoneArray.length - 1));
                    [phoneArray[errorIndex], phoneArray[errorIndex + 1]] = [phoneArray[errorIndex + 1], phoneArray[errorIndex]];
                    phone = phoneArray.join('');
                }
                name = erroneousName
            }
            data.push({randomIdentifier, name, address, phone});
        }
        let dataForSeed = {}
        dataForSeed[String(seed)+String(errorAmount)] = data
        setSeedData({...seedData, ...dataForSeed})
        return data;
    }

    const [data, setData] = useState([])
    const [errorAmount, setErrorAmount] = useState(1)
    const onChangeSlider = (value) => {
        setErrorAmount(value)
    }

    const onChangeErrorInput = (e) => {
        if(Number(e.target.value) > 1000){
            return message.error("Error amount cannot be greater than 1000");
        }
        if (isNaN(e.target.value)) {
            return;
        }
        setErrorAmount(e.target.value)
    }

    const [seed, setSeed] = useState(0)
    const onChangeSeed = (e) => {
        if (isNaN(e.target.value)) {
            return;
        }
        setSeed(e.target.value)
    }

    const [getData, setGetData] = useState(false)

    const onScroll = debounce(() => {
        const {scrollTop, scrollHeight, clientHeight} = document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight) {
            setData(prevData => [...prevData, ...dataGenerator(region, seed, errorAmount, 20)]);
        }
    }, 200);


    useEffect(() => {
        window.addEventListener('scroll', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
        };
    }, [getData]);

    useEffect(()=>{
        setData(dataGenerator(region, seed, errorAmount, 20))
        setGetData(prev=>!prev)
    }, [region, errorAmount])

    useEffect(()=>{
        console.log("SEED", seed)
        console.log(seedData, "SEED DATA")
        if(seedData[String(seed)+String(errorAmount)]){
            setData(seedData[String(seed)+String(errorAmount)])
            console.log("SETT DATAAA")
        }
        else {
            console.log("GENERATE DATA")
            setData(dataGenerator(region, seed, errorAmount, 20))
        }
    },[seed])
    return (
        <div>
            <h3 className="text-center mt-3">Fake data generator</h3>
            <div className="header d-flex justify-content-center p-4">
                <div className="d-flex justify-content-center w-75">
                    <div className="mx-3">
                        <h6>Region</h6>
                        <Select
                            defaultValue={region}
                            style={{
                                width: 120,
                            }}
                            onChange={handleChange}
                            options={
                                regions.map((region) => {
                                    return {label: region.name, value: region.locale}
                                })
                            }
                        />
                    </div>
                    <div style={{width: "30%"}}>
                        <h6>Errors per Record:</h6>
                        <Slider onChange={onChangeSlider} value={errorAmount} max={10} min={0} defaultValue={1}
                                step={0.1}/>
                    </div>
                    <div className="mx-3">
                        <h6>Custom error</h6>
                        <input onChange={(e) => onChangeErrorInput(e)} className="input" value={errorAmount}
                               type="number"/>
                    </div>
                    <div>
                        <h6>Seed</h6>
                        <input onChange={(e) => onChangeSeed(e)} value={seed} className="input" type="number"/>
                    </div>
                </div>
            </div>
            <div>
                <Table
                    pagination={false}
                    columns={columns}
                    dataSource={data}/>
            </div>
        </div>
    );
}

export default App;
