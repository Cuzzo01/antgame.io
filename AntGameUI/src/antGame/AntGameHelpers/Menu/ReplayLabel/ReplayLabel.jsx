import globalStyles from "../../../Helpers/GenericStyles.module.css"

export default function ReplayLabel({label}) {

    return (
        <div className={globalStyles.bold}>
            {label}
        </div>
    )
}