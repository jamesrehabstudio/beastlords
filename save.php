<?php
$database = "birdy915_rpg";
$database_user = "root";
$database_pass = "";
$database_host = "localhost";

mysql_connect( $database_host, $database_user, $database_pass );
mysql_select_db( $database );


header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Content-type: application/json');

$id = isset( $_REQUEST['id'] ) ? (int)$_REQUEST['id'] : false;
$name = isset( $_REQUEST['name'] ) ? stripslashes( $_REQUEST['name'] ) : false;

if ( !empty( $_POST ) ) {
	$name = addslashes( $_POST['name'] );
	$data = addslashes( $_POST['data'] );

	$map = false;
	$sql = mysql_query("SELECT * FROM maps WHERE name = '$name'");
	while( $row = mysql_fetch_assoc( $sql ) ){$map = $row;};

	if ( $map ) {
		//Update existing map
		mysql_query( "UPDATE maps SET name = '$name', data = '$data' WHERE name='$name'" );
	} else {
		//Create a new map
		mysql_query( "INSERT INTO maps (name, data) VALUES ('$name', '$data')" );
		$id = mysql_insert_id();
	}
}
if ( $id ) {
	$map = false;
	$sql = mysql_query("SELECT * FROM maps WHERE id = '$id'");
	while( $row = mysql_fetch_assoc( $sql ) ){$map = $row;};
	
	echo $map['data'];
} elseif ( $name ) {
	$map = false;
	$sql = mysql_query("SELECT * FROM maps WHERE name = '$name'");
	while( $row = mysql_fetch_assoc( $sql ) ){$map = $row;};
	
	echo $map['data'];
} else {
	echo json_encode( Array( "message" => "No data", "name" => $name ) );
}
?>