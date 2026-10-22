import useFields from "../Settings/Fields/FieldsData";
import useStatistics from "./StatisticsData";
import { useState, useEffect } from "@wordpress/element";
import useLicense from "../Settings/License/LicenseData";
import {memo} from "@wordpress/element";
// import { useMemo } from 'react';
const Statistics = () => {

	const {fields, getFieldValue} = useFields();
	const [abTestingEnabled, setAbTestingEnabled] = useState(false);
	const [data, setData] = useState(false);
	const {consentType, setConsentType, statisticsData, emptyStatisticsData, consentTypes, loaded, fetchStatisticsData, statisticsLoading} = useStatistics();
	const [Bar, setBar] = useState(null);
	const {licenseStatus} = useLicense();

	useEffect ( () => {
		import ('chart.js').then(({
			  Chart,
			  CategoryScale,
			  LinearScale,
			  BarElement,
			  Title,
			  Tooltip,
			  Legend
		}) => {
			Chart.register(
				CategoryScale,
				LinearScale,
				BarElement,
				Title,
				Tooltip,
				Legend
			);
		});
		import ('react-chartjs-2').then(({ Bar }) => {
			setBar(() => Bar);
		});
	}, []);

	useEffect(() => {
		if ( !loaded && abTestingEnabled) {
			fetchStatisticsData();
		}
	},[loaded, abTestingEnabled ]);

	useEffect(() => {
		if (getFieldValue('a_b_testing')==1) {
			setAbTestingEnabled(true);
		} else {
			setAbTestingEnabled(false);
		}
	},[fields]);

	useEffect(() => {
		//initial values
		if (licenseStatus==='valid' && abTestingEnabled) {
			if (emptyStatisticsData.hasOwnProperty(consentType)) {
				setData(emptyStatisticsData[consentType]);
			}
		} else {
			if (statisticsData.hasOwnProperty(consentType)) {
				setData(statisticsData[consentType]);
			}
		}

	},[])

	useEffect(() => {
		if (abTestingEnabled) {
			setData(statisticsData[consentType]);
		}
	},[consentType, abTestingEnabled, loaded])


	const options = {
		responsive: true,
		plugins: {
			legend: {
				position: 'top',
			},
		},
	};
	// Loading dim migrated from legacy-globals.scss `.cmplz-loading-container`/`.cmplz-loading` (Bundle D
	// B2): the opacity/filter transition + the 0.3 loading opacity become tw- utilities on the chart.
	const loadingClass = statisticsLoading ? 'tw-opacity-30' : '';
	return (
		 <>
			 {consentTypes.length>1 && <select value={consentType} onChange={(e) => setConsentType(e.target.value)}>
				 {consentTypes.map((type, i) =>
					 <option key={i} value={type.id} >{type.label}</option>)}
			 </select>}
			 {data && Bar && <Bar className={`tw-[transition:opacity_0.2s_ease-in-out,_filter_0.2s_ease-in-out] ${loadingClass}`} options={options} data={data} />}
		 </>
	);
};

export default memo(Statistics);

