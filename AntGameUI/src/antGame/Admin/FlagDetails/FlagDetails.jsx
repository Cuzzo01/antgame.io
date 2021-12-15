import { useEffect, useState } from "react";
import { getFlagDetails } from "../AdminService";
import AdminStyles from "../AdminStyles.module.css";

const FlagDetails = (props) => {
    const [flag, setFlag] = useState({});

    useEffect(() => {
        const id = props.id;
        getFlagDetails(id).then(flagDetails => {
            setFlag(flagDetails);
        });
    }, [props.id]);

    return (
        <div>
            <h3>Flag Details</h3>
            <div className={AdminStyles.divSection}>
                <h5><strong>Flag Name</strong></h5>
                <span>{flag.name}</span>
            </div>
            <FlexValueEditDisplay flag={flag} />
        </div>
    )
}
export default FlagDetails;

const FlexValueEditDisplay = (props) => {
    const { flag } = props;
    return (
        <div className={AdminStyles.divSection}>
            <h5><strong>Flag Value</strong></h5>
            <ValueDisplay flag={flag} />
        </div>
    )
}

const ValueDisplay = (props) => {
    const [valueToDisplay, setValueToDisplay] = useState("");

    useEffect(() => {
        debugger
        const flag = props.flag;
        let display = "";
        switch (flag.type) {
            case "bool":
                display = flag.value ? "True" : "False";
                break;
            case "object":
                // let fieldsList;
                Object.keys(flag.value).forEach(key => {
                    // debugger;
                    const value = flag.value[key];
                    const type = flag.fields[key]
                    display += (
                        <div>
                            <h6>{key}</h6>
                            <ValueDisplay flag={{ type: type, value: value }} />
                        </div>
                    )
                });
                break;
            case "int":
                display = flag.value;
                break;
            default:
                display = flag.value;
        }
        
        setValueToDisplay(display);
    }, [props.flag]);

    return (
        <span>{valueToDisplay}</span>
    )
}